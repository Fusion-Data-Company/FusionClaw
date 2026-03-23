const SECTION_MARKERS: Record<string, { start: string; end: string }> = {
  blog: { start: "---BEGIN BLOG POST---", end: "---END BLOG POST---" },
  facebook: { start: "---BEGIN FACEBOOK---", end: "---END FACEBOOK---" },
  linkedin: { start: "---BEGIN LINKEDIN---", end: "---END LINKEDIN---" },
  instagram: { start: "---BEGIN INSTAGRAM---", end: "---END INSTAGRAM---" },
  twitter: { start: "---BEGIN TWITTER---", end: "---END TWITTER---" },
  threads: { start: "---BEGIN THREADS---", end: "---END THREADS---" },
  pinterest: { start: "---BEGIN PINTEREST---", end: "---END PINTEREST---" },
  reddit: { start: "---BEGIN REDDIT---", end: "---END REDDIT---" },
};

const IMAGE_PROMPT_MARKER = {
  start: "---BEGIN IMAGE PROMPT---",
  end: "---END IMAGE PROMPT---",
};

export const PLATFORM_LIMITS: Record<string, number> = {
  facebook: 63206,
  linkedin: 3000,
  instagram: 2200,
  twitter: 280,
  threads: 500,
  pinterest: 500,
  reddit: 40000,
};

export function extractSection(fullText: string, key: string): string {
  const markers = SECTION_MARKERS[key];
  if (!markers) return "";
  const startIdx = fullText.indexOf(markers.start);
  const endIdx = fullText.indexOf(markers.end);
  if (startIdx === -1) return "";
  const contentStart = startIdx + markers.start.length;
  if (endIdx === -1) return fullText.slice(contentStart).trim();
  return fullText.slice(contentStart, endIdx).trim();
}

export function parseAllSections(fullText: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(SECTION_MARKERS)) {
    const content = extractSection(fullText, key);
    if (content) result[key] = content;
  }
  return result;
}

export function hasSectionMarkers(text: string): boolean {
  return Object.values(SECTION_MARKERS).some(
    (m) => text.includes(m.start)
  );
}

export interface ImagePrompt {
  description: string;
  type: string;
  style: string;
  aspectRatio: string;
}

export function extractImagePrompts(fullText: string): ImagePrompt[] {
  const prompts: ImagePrompt[] = [];
  let searchFrom = 0;

  while (true) {
    const startIdx = fullText.indexOf(IMAGE_PROMPT_MARKER.start, searchFrom);
    if (startIdx === -1) break;

    const contentStart = startIdx + IMAGE_PROMPT_MARKER.start.length;
    const endIdx = fullText.indexOf(IMAGE_PROMPT_MARKER.end, contentStart);
    const raw = endIdx === -1
      ? fullText.slice(contentStart).trim()
      : fullText.slice(contentStart, endIdx).trim();

    if (raw) {
      // Parse structured format: Type: ...\nStyle: ...\nAspect: ...\nPrompt: ...
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      let type = "hero";
      let style = "bright, modern infographic";
      let aspectRatio = "16:9";
      let description = raw;

      for (const line of lines) {
        if (line.toLowerCase().startsWith("type:")) type = line.slice(5).trim();
        else if (line.toLowerCase().startsWith("style:")) style = line.slice(6).trim();
        else if (line.toLowerCase().startsWith("aspect:")) aspectRatio = line.slice(7).trim();
        else if (line.toLowerCase().startsWith("prompt:")) description = line.slice(7).trim();
      }

      // If no explicit "Prompt:" line, use the whole block minus parsed fields
      if (description === raw && lines.some((l) => l.includes(":"))) {
        const promptLines = lines.filter(
          (l) =>
            !l.toLowerCase().startsWith("type:") &&
            !l.toLowerCase().startsWith("style:") &&
            !l.toLowerCase().startsWith("aspect:")
        );
        if (promptLines.length > 0) description = promptLines.join(" ");
      }

      prompts.push({ description, type, style, aspectRatio });
    }

    searchFrom = endIdx === -1 ? fullText.length : endIdx + IMAGE_PROMPT_MARKER.end.length;
  }

  return prompts;
}

export function hasImagePrompts(text: string): boolean {
  return text.includes(IMAGE_PROMPT_MARKER.start);
}
