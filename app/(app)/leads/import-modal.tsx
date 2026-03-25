"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  X,
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type Step = 1 | 2 | 3;

interface ColumnMapping {
  [csvHeader: string]: string; // csvHeader → leadField
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Lead field options for mapping dropdown ────────────────────────────────

const LEAD_FIELDS: { value: string; label: string }[] = [
  { value: "", label: "-- Skip this column --" },
  { value: "company", label: "Company" },
  { value: "type", label: "Type" },
  { value: "contactType", label: "Contact Type" },
  { value: "website", label: "Website" },
  { value: "contact", label: "Contact Name" },
  { value: "jobTitle", label: "Job Title" },
  { value: "phone", label: "Phone" },
  { value: "altPhone", label: "Alt Phone" },
  { value: "email", label: "Email" },
  { value: "email2", label: "Email 2" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitterX", label: "Twitter / X" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "address", label: "Address" },
  { value: "description", label: "Description" },
  { value: "status", label: "Status" },
  { value: "notes", label: "Notes" },
  { value: "source", label: "Source" },
  { value: "priority", label: "Priority" },
  { value: "dealValue", label: "Deal Value" },
  { value: "tags", label: "Tags" },
];

// ─── Fuzzy matching rules ───────────────────────────────────────────────────

const FUZZY_MAP: { patterns: string[]; field: string }[] = [
  { patterns: ["company", "business", "business name", "company name", "org", "organization"], field: "company" },
  { patterns: ["name", "contact", "contact name", "full name", "person", "first name"], field: "contact" },
  { patterns: ["email", "email address", "e-mail", "mail"], field: "email" },
  { patterns: ["phone", "phone number", "tel", "telephone", "mobile", "cell"], field: "phone" },
  { patterns: ["website", "url", "web", "site", "domain"], field: "website" },
  { patterns: ["address", "location", "street", "city"], field: "address" },
  { patterns: ["title", "job title", "position", "role"], field: "jobTitle" },
  { patterns: ["linkedin", "linkedin url", "linkedin profile"], field: "linkedin" },
  { patterns: ["instagram"], field: "instagram" },
  { patterns: ["facebook"], field: "facebook" },
  { patterns: ["twitter", "x", "twitter/x"], field: "twitterX" },
  { patterns: ["notes", "comments", "description"], field: "notes" },
  { patterns: ["status"], field: "status" },
  { patterns: ["priority"], field: "priority" },
  { patterns: ["source", "lead source", "origin"], field: "source" },
  { patterns: ["deal value", "value", "amount", "deal", "revenue"], field: "dealValue" },
  { patterns: ["tags", "labels", "categories"], field: "tags" },
];

function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<string>();

  for (const header of headers) {
    const normalized = header.trim().toLowerCase();
    let matched = false;

    for (const { patterns, field } of FUZZY_MAP) {
      if (usedFields.has(field)) continue;
      if (patterns.includes(normalized)) {
        mapping[header] = field;
        usedFields.add(field);
        matched = true;
        break;
      }
    }

    if (!matched) {
      mapping[header] = "";
    }
  }

  return mapping;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ImportModal({ open, onClose, onImportComplete }: ImportModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Reset ──────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStep(1);
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setImporting(false);
    setResult(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ─── File parse ─────────────────────────────────────────────────────────

  const parseFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(f);

    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          toast.error("Could not detect CSV headers");
          return;
        }

        const headers = results.meta.fields;
        const data = results.data as Record<string, string>[];

        setCsvHeaders(headers);
        setCsvData(data);
        setMapping(autoDetectMapping(headers));
        toast.success(`Parsed ${data.length} rows from ${f.name}`);
      },
      error: (err) => {
        toast.error(`Parse error: ${err.message}`);
      },
    });
  }, []);

  // ─── Drop handlers ──────────────────────────────────────────────────────

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  // ─── Mapping change ────────────────────────────────────────────────────

  const updateMapping = useCallback((csvHeader: string, leadField: string) => {
    setMapping((prev) => ({ ...prev, [csvHeader]: leadField }));
  }, []);

  // ─── Build mapped leads ─────────────────────────────────────────────────

  const buildMappedLeads = useCallback(() => {
    return csvData.map((row) => {
      const lead: Record<string, string> = {};
      for (const [csvHeader, leadField] of Object.entries(mapping)) {
        if (leadField && row[csvHeader] !== undefined) {
          lead[leadField] = row[csvHeader].trim();
        }
      }
      return lead;
    });
  }, [csvData, mapping]);

  // ─── Import ─────────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    const mappedLeads = buildMappedLeads();

    // Filter out empty rows (no company name)
    const validLeads = mappedLeads.filter((l) => l.company && l.company.length > 0);

    if (validLeads.length === 0) {
      toast.error("No valid leads to import. Make sure 'company' is mapped.");
      return;
    }

    setImporting(true);

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: validLeads }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Import failed (${res.status})`);
      }

      const data = await res.json();

      setResult({
        imported: data.imported ?? validLeads.length,
        skipped: data.skipped ?? mappedLeads.length - validLeads.length,
        errors: data.errors ?? [],
      });

      setStep(3);
      toast.success(`Imported ${data.imported ?? validLeads.length} leads`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, [buildMappedLeads]);

  // ─── Preview data (first 5 rows) ───────────────────────────────────────

  const previewRows = csvData.slice(0, 5);
  const activeMappings = Object.entries(mapping).filter(([, v]) => v !== "");
  const hasMapping = activeMappings.length > 0;
  const hasCompanyMapping = Object.values(mapping).includes("company");

  // ─── Render ─────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] mx-4 bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Import Contacts
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {step === 1 && "Upload a CSV file"}
              {step === 2 && "Map columns to contact fields"}
              {step === 3 && "Import complete"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 shrink-0">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  s === step
                    ? "bg-cyan-500 text-black"
                    : s < step
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-white/5 text-text-muted"
                }`}
              >
                {s < step ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span
                className={`text-xs font-medium ${
                  s === step ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {s === 1 ? "Upload" : s === 2 ? "Map Columns" : "Results"}
              </span>
              {s < 3 && <ChevronRight className="w-3.5 h-3.5 text-text-muted mx-1" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ─── Step 1: Upload ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-cyan-500 bg-cyan-500/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={onFileChange}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-secondary">
                  Drag and drop a CSV file here, or click to browse
                </p>
                <p className="text-xs text-text-muted mt-1">Supports .csv files</p>
              </div>

              {file && csvData.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary font-medium truncate">{file.name}</p>
                    <p className="text-xs text-text-muted">
                      {csvData.length.toLocaleString()} rows &middot; {csvHeaders.length} columns
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* ─── Step 2: Map Columns ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Mapping rows */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Column Mapping</h3>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs text-text-muted font-medium uppercase tracking-wider mb-2 px-1">
                  <span>CSV Header</span>
                  <span />
                  <span>Lead Field</span>
                </div>
                {csvHeaders.map((header) => (
                  <div
                    key={header}
                    className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center"
                  >
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-text-secondary font-mono truncate">
                      {header}
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                    <select
                      value={mapping[header] || ""}
                      onChange={(e) => updateMapping(header, e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm border outline-none cursor-pointer transition-colors ${
                        mapping[header]
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                          : "bg-white/[0.03] border-white/10 text-text-muted"
                      }`}
                    >
                      {LEAD_FIELDS.map((f) => (
                        <option key={f.value} value={f.value} className="bg-[#0D0D0D] text-text-secondary">
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              {hasMapping && previewRows.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Preview (first {previewRows.length} rows)
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white/[0.03]">
                          {activeMappings.map(([csvH, leadF]) => (
                            <th
                              key={csvH}
                              className="px-3 py-2 text-left text-text-muted font-semibold uppercase tracking-wider whitespace-nowrap"
                            >
                              {LEAD_FIELDS.find((f) => f.value === leadF)?.label ?? leadF}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                            {activeMappings.map(([csvH]) => (
                              <td
                                key={csvH}
                                className="px-3 py-2 text-text-secondary font-mono whitespace-nowrap max-w-[200px] truncate"
                              >
                                {row[csvH] || <span className="text-text-muted italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!hasCompanyMapping && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    The &quot;Company&quot; field must be mapped. Rows without a company name will be
                    skipped.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Results ─────────────────────────────────────────── */}
          {step === 3 && result && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.imported.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1">Imported</p>
                </div>
                <div className="px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-2xl font-bold text-amber-400">{result.skipped.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1">Skipped</p>
                </div>
                <div className="px-4 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-2xl font-bold text-red-400">{result.errors.length.toLocaleString()}</p>
                  <p className="text-xs text-text-muted mt-1">Errors</p>
                </div>
              </div>

              {/* Error list */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-text-primary">Errors</h3>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                    {result.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300 font-mono">{err}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length === 0 && result.imported > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-xs text-green-300">
                    All leads imported successfully.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 3 ? (
              <button
                onClick={() => {
                  handleClose();
                  onImportComplete();
                }}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                Done
              </button>
            ) : step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={csvData.length === 0}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={!hasCompanyMapping || importing}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Import {csvData.length.toLocaleString()} Rows
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
