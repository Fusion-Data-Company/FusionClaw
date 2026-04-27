/**
 * Bulletproof file → text extraction for the Wiki Brain ingest pipeline.
 *
 * Accepts ANY file type. Returns either extracted text (for content the wiki
 * agent can read) or marks the source as binary-archive (stored as-is in Blob,
 * referenced by URL). Never throws — every error path returns a structured
 * result that the ingest agent can act on.
 */

import { fileTypeFromBuffer } from "file-type";
import { createHash } from "crypto";

export type ExtractionKind =
  | "text"           // utf8 text file (md, txt, json, csv, code, html, xml, yaml, etc.)
  | "pdf"            // pdf-parse extracted
  | "docx"           // mammoth extracted
  | "image"          // image — text via vision later, store as binary now
  | "audio"          // audio — transcript later, store as binary
  | "video"          // video — frame extract / transcript later
  | "archive"        // zip/tar — could be expanded later
  | "spreadsheet"    // xlsx — TODO sheet parser
  | "binary"         // unknown binary — stored as-is
  | "empty";         // file is empty

export interface ExtractionResult {
  kind: ExtractionKind;
  mimeType: string;
  fileExtension: string | null;
  /** UTF-8 text body if extractable. Null for pure-binary stored files. */
  text: string | null;
  /** Whether the original buffer should be archived (true for binary kinds). */
  archive: boolean;
  /** Bytes — useful for cap checks. */
  sizeBytes: number;
  /** SHA-256 of the original buffer for idempotency. */
  contentHash: string;
  /** Extra metadata extracted (page count, dimensions, etc.). */
  meta: Record<string, unknown>;
  /** Non-fatal warnings collected during extraction. */
  warnings: string[];
  /** Fatal error if extraction failed catastrophically. Result still returned. */
  error: string | null;
}

const MAX_BYTES = 100 * 1024 * 1024; // 100MB hard cap
const TEXT_LIKE_EXTENSIONS = new Set([
  "md", "markdown", "txt", "log", "json", "yaml", "yml", "toml", "ini",
  "csv", "tsv", "tab",
  "html", "htm", "xml", "svg",
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "rb", "go", "rs", "java", "kt", "swift", "c", "h", "cpp", "hpp",
  "css", "scss", "sass", "less",
  "sh", "bash", "zsh", "fish", "ps1",
  "sql", "graphql", "gql",
  "env", "gitignore", "dockerfile",
  "vue", "svelte", "astro",
  "yaml", "edn", "lisp", "clj",
]);

function hashBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function looksLikeUtf8Text(buf: Buffer): boolean {
  // Heuristic: scan first 8KB. If <0.5% non-printable bytes (excl whitespace), call it text.
  const sample = buf.subarray(0, Math.min(buf.length, 8192));
  if (sample.length === 0) return false;
  let bad = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    // Allow tab(9), LF(10), CR(13), and printable ASCII through 0x7E. Allow UTF-8 high bytes.
    if (b === 9 || b === 10 || b === 13) continue;
    if (b >= 32 && b <= 126) continue;
    if (b >= 128) continue; // UTF-8 continuation/lead bytes
    bad++;
  }
  return bad / sample.length < 0.005;
}

function extensionOf(filename: string): string | null {
  const m = filename.match(/\.([A-Za-z0-9]+)$/);
  return m ? m[1].toLowerCase() : null;
}

async function detectMime(buf: Buffer, filename: string): Promise<{ mimeType: string; ext: string | null }> {
  const ext = extensionOf(filename);
  try {
    const sniffed = await fileTypeFromBuffer(buf);
    if (sniffed) return { mimeType: sniffed.mime, ext: sniffed.ext };
  } catch {
    /* fall through */
  }
  // Fall back to extension-based mapping for text-like files file-type can't detect.
  if (ext && TEXT_LIKE_EXTENSIONS.has(ext)) {
    return { mimeType: extToMime(ext), ext };
  }
  if (looksLikeUtf8Text(buf)) {
    return { mimeType: "text/plain", ext: ext ?? "txt" };
  }
  return { mimeType: "application/octet-stream", ext };
}

function extToMime(ext: string): string {
  const map: Record<string, string> = {
    md: "text/markdown", markdown: "text/markdown",
    txt: "text/plain", log: "text/plain",
    json: "application/json",
    yaml: "application/yaml", yml: "application/yaml",
    toml: "application/toml",
    csv: "text/csv", tsv: "text/tab-separated-values",
    html: "text/html", htm: "text/html",
    xml: "application/xml", svg: "image/svg+xml",
    ts: "text/typescript", tsx: "text/typescript",
    js: "text/javascript", jsx: "text/javascript",
    py: "text/x-python", rb: "text/x-ruby", go: "text/x-go",
    rs: "text/x-rust", java: "text/x-java",
    css: "text/css", scss: "text/scss",
    sh: "application/x-sh", bash: "application/x-sh",
    sql: "application/sql",
    env: "text/plain", gitignore: "text/plain",
  };
  return map[ext] ?? "text/plain";
}

async function extractPdf(buf: Buffer): Promise<{ text: string; meta: Record<string, unknown>; warnings: string[] }> {
  const warnings: string[] = [];
  try {
    // Lazy import — keeps cold-start cost off non-PDF paths.
    const mod: any = await import("pdf-parse");
    const pdfParse = mod.default ?? mod;
    const result = await pdfParse(buf);
    return {
      text: result.text ?? "",
      meta: { pages: result.numpages, info: result.info ?? null },
      warnings,
    };
  } catch (err) {
    warnings.push(`pdf-parse failed: ${(err as Error).message}`);
    return { text: "", meta: {}, warnings };
  }
}

async function extractDocx(buf: Buffer): Promise<{ text: string; meta: Record<string, unknown>; warnings: string[] }> {
  const warnings: string[] = [];
  try {
    const mod: any = await import("mammoth");
    const result = await mod.extractRawText({ buffer: buf });
    if (result.messages?.length) {
      for (const m of result.messages.slice(0, 5)) warnings.push(`mammoth: ${m.message}`);
    }
    return { text: result.value ?? "", meta: {}, warnings };
  } catch (err) {
    warnings.push(`mammoth failed: ${(err as Error).message}`);
    return { text: "", meta: {}, warnings };
  }
}

/**
 * Extract a buffer into a structured ingest result. Never throws.
 *
 * @param buf - the raw file bytes
 * @param filename - the original filename (used for ext fallback)
 */
export async function extractFile(buf: Buffer, filename: string): Promise<ExtractionResult> {
  const sizeBytes = buf.length;
  const contentHash = hashBuffer(buf);
  const warnings: string[] = [];

  if (sizeBytes === 0) {
    return {
      kind: "empty", mimeType: "application/octet-stream", fileExtension: extensionOf(filename),
      text: null, archive: false, sizeBytes, contentHash, meta: {}, warnings: ["file is empty"], error: null,
    };
  }
  if (sizeBytes > MAX_BYTES) {
    return {
      kind: "binary", mimeType: "application/octet-stream", fileExtension: extensionOf(filename),
      text: null, archive: true, sizeBytes, contentHash, meta: {}, warnings: [],
      error: `file exceeds ${MAX_BYTES} byte cap`,
    };
  }

  const { mimeType, ext } = await detectMime(buf, filename);

  // Branch on detected type. Each branch is independently failure-safe.
  try {
    // PDF
    if (mimeType === "application/pdf" || ext === "pdf") {
      const r = await extractPdf(buf);
      return {
        kind: "pdf", mimeType: "application/pdf", fileExtension: ext ?? "pdf",
        text: r.text, archive: true, sizeBytes, contentHash,
        meta: r.meta, warnings: [...warnings, ...r.warnings], error: null,
      };
    }
    // DOCX
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      const r = await extractDocx(buf);
      return {
        kind: "docx", mimeType, fileExtension: ext ?? "docx",
        text: r.text, archive: true, sizeBytes, contentHash,
        meta: r.meta, warnings: [...warnings, ...r.warnings], error: null,
      };
    }
    // Spreadsheets — XLSX/ODS — store binary; future: parse via SheetJS
    if (ext === "xlsx" || ext === "xls" || ext === "ods" || mimeType.includes("spreadsheet")) {
      return {
        kind: "spreadsheet", mimeType, fileExtension: ext,
        text: null, archive: true, sizeBytes, contentHash, meta: {},
        warnings: ["spreadsheet content stored as binary; parse handler not yet wired"], error: null,
      };
    }
    // Images
    if (mimeType.startsWith("image/")) {
      return {
        kind: "image", mimeType, fileExtension: ext,
        text: null, archive: true, sizeBytes, contentHash, meta: {},
        warnings: ["image stored as binary; vision OCR can be applied via /api/wiki/process"], error: null,
      };
    }
    // Audio / Video
    if (mimeType.startsWith("audio/")) {
      return {
        kind: "audio", mimeType, fileExtension: ext,
        text: null, archive: true, sizeBytes, contentHash, meta: {},
        warnings: ["audio stored; transcribe via /api/wiki/process"], error: null,
      };
    }
    if (mimeType.startsWith("video/")) {
      return {
        kind: "video", mimeType, fileExtension: ext,
        text: null, archive: true, sizeBytes, contentHash, meta: {},
        warnings: ["video stored; transcript/frames via /api/wiki/process"], error: null,
      };
    }
    // Archives
    if (
      mimeType === "application/zip" || mimeType === "application/x-tar" ||
      mimeType === "application/gzip" || ext === "zip" || ext === "tar" || ext === "gz"
    ) {
      return {
        kind: "archive", mimeType, fileExtension: ext,
        text: null, archive: true, sizeBytes, contentHash, meta: {},
        warnings: ["archive stored as binary; extraction handler can unpack later"], error: null,
      };
    }
    // Text-like — any UTF-8 readable thing
    const isTextExt = ext != null && TEXT_LIKE_EXTENSIONS.has(ext);
    if (isTextExt || mimeType.startsWith("text/") || looksLikeUtf8Text(buf)) {
      const text = buf.toString("utf8");
      return {
        kind: "text", mimeType: mimeType.startsWith("text/") ? mimeType : extToMime(ext ?? "txt"),
        fileExtension: ext, text, archive: false, sizeBytes, contentHash,
        meta: { lineCount: text.split("\n").length }, warnings, error: null,
      };
    }
    // Unknown binary — keep it
    return {
      kind: "binary", mimeType, fileExtension: ext,
      text: null, archive: true, sizeBytes, contentHash, meta: {},
      warnings: ["unknown binary; stored as-is for later inspection"], error: null,
    };
  } catch (err) {
    return {
      kind: "binary", mimeType, fileExtension: ext,
      text: null, archive: true, sizeBytes, contentHash, meta: {},
      warnings, error: `extraction failed: ${(err as Error).message}`,
    };
  }
}
