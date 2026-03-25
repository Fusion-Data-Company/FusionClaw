"use client";

import { useState, useEffect } from "react";
import { X, Zap, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface VaultEntry {
  id: string;
  provider: string;
  label: string;
  status: string;
}

const ENRICHMENT_FIELDS = [
  { key: "email", label: "Email Address" },
  { key: "phone", label: "Phone Number" },
  { key: "linkedin", label: "LinkedIn Profile" },
  { key: "jobTitle", label: "Job Title" },
  { key: "website", label: "Company Website" },
  { key: "address", label: "Business Address" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitterX", label: "Twitter/X" },
];

interface EnrichModalProps {
  open: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
  onEnrichComplete: () => void;
}

export default function EnrichModal({ open, onClose, selectedLeadIds, onEnrichComplete }: EnrichModalProps) {
  const [providers, setProviders] = useState<VaultEntry[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>(["email", "phone", "linkedin"]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ jobId: string; status: string } | null>(null);
  const [jobStatus, setJobStatus] = useState<{
    status: string;
    enrichedCount: number;
    failedCount: number;
    totalLeads: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      fetchProviders();
      setResult(null);
      setJobStatus(null);
    }
  }, [open]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        const active = (data.providers || []).filter((p: VaultEntry) => p.status === "active");
        setProviders(active);
        if (active.length > 0 && !selectedProvider) {
          setSelectedProvider(active[0].provider);
        }
      }
    } catch {
      // No providers
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleEnrich = async () => {
    if (!selectedProvider || selectedFields.length === 0) return;
    setRunning(true);
    try {
      const res = await fetch("/api/enrichment/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          provider: selectedProvider,
          fieldsToEnrich: selectedFields,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        // Poll job status
        pollJob(data.jobId);
      } else {
        toast.error(data.error || "Enrichment failed");
        setRunning(false);
      }
    } catch {
      toast.error("Enrichment failed");
      setRunning(false);
    }
  };

  const pollJob = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/enrichment/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data.job);
          if (data.job.status === "completed" || data.job.status === "failed") {
            clearInterval(interval);
            setRunning(false);
            if (data.job.status === "completed") {
              toast.success(`Enriched ${data.job.enrichedCount} leads`);
              onEnrichComplete();
            }
          }
        }
      } catch {
        clearInterval(interval);
        setRunning(false);
      }
    }, 2000);
    // Cleanup after 5 minutes max
    setTimeout(() => clearInterval(interval), 300000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0D0D0D] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">Enrich Leads</h2>
              <p className="text-[11px] text-text-muted">{selectedLeadIds.length} leads selected</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-text-primary font-medium">No enrichment providers configured</p>
              <p className="text-xs text-text-muted mt-1">
                Go to Settings → Integrations to connect Apollo, Hunter, Apify, or other providers.
              </p>
            </div>
          ) : jobStatus ? (
            /* Results */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {jobStatus.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : jobStatus.status === "running" ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-error" />
                )}
                <span className="text-sm font-semibold text-text-primary capitalize">{jobStatus.status}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${jobStatus.totalLeads > 0 ? ((jobStatus.enrichedCount + jobStatus.failedCount) / jobStatus.totalLeads) * 100 : 0}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-white/5 bg-[#0A0A0A] p-3">
                  <div className="text-lg font-bold text-success">{jobStatus.enrichedCount}</div>
                  <div className="text-[10px] text-text-muted">Enriched</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#0A0A0A] p-3">
                  <div className="text-lg font-bold text-error">{jobStatus.failedCount}</div>
                  <div className="text-[10px] text-text-muted">Failed</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-[#0A0A0A] p-3">
                  <div className="text-lg font-bold text-text-primary">{jobStatus.totalLeads}</div>
                  <div className="text-[10px] text-text-muted">Total</div>
                </div>
              </div>
            </div>
          ) : (
            /* Configuration */
            <>
              {/* Provider select */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Enrichment Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {providers.map((p) => (
                    <button
                      key={p.provider}
                      onClick={() => setSelectedProvider(p.provider)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all ${
                        selectedProvider === p.provider
                          ? "border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
                          : "border-white/5 bg-[#0A0A0A] text-text-secondary hover:border-white/10"
                      }`}
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${selectedProvider === p.provider ? "text-cyan-400" : "text-text-disabled"}`} />
                      <span className="text-xs font-medium capitalize">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields to enrich */}
              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Fields to Enrich</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ENRICHMENT_FIELDS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition-all ${
                        selectedFields.includes(f.key)
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                          : "border-white/5 bg-[#0A0A0A] text-text-muted hover:border-white/10"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-white/5 bg-[#0A0A0A] px-4 py-3">
                <p className="text-xs text-text-secondary">
                  Will enrich <span className="font-bold text-text-primary">{selectedLeadIds.length}</span> leads
                  using <span className="font-bold text-cyan-400 capitalize">{selectedProvider}</span> for{" "}
                  <span className="font-bold text-text-primary">{selectedFields.length}</span> fields
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-6 py-4 flex justify-end gap-2">
          {jobStatus?.status === "completed" || jobStatus?.status === "failed" ? (
            <button onClick={onClose} className="rounded-lg bg-cyan-500 px-6 py-2 text-xs font-semibold text-black">
              Done
            </button>
          ) : (
            <>
              <button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-text-muted">
                Cancel
              </button>
              <button
                onClick={handleEnrich}
                disabled={running || !selectedProvider || selectedFields.length === 0 || providers.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-6 py-2 text-xs font-semibold text-black hover:bg-cyan-400 transition-colors disabled:opacity-50"
              >
                {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {running ? "Running..." : "Start Enrichment"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
