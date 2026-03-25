"use client";

import { useState } from "react";
import {
  CheckCircle, XCircle, Loader2, Trash2, Eye, EyeOff,
  RefreshCw, AlertTriangle, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export interface VaultEntry {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  status: string;
  lastUsedAt: string | null;
  scopes: string[];
  createdAt: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  docsUrl: string;
  keyPlaceholder: string;
  hasSecret?: boolean;
  secretPlaceholder?: string;
  scopes?: string[];
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "apollo",
    name: "Apollo.io",
    description: "B2B enrichment — email, phone, title, company size, tech stack",
    icon: "A",
    color: "text-blue-400 bg-blue-500/10",
    docsUrl: "https://docs.apollo.io/reference/people-enrichment",
    keyPlaceholder: "Enter your Apollo API key",
    scopes: ["people_enrichment", "org_enrichment"],
  },
  {
    id: "apify",
    name: "Apify",
    description: "Web scraping actors — Google Maps, LinkedIn, any website",
    icon: "Ap",
    color: "text-green-400 bg-green-500/10",
    docsUrl: "https://docs.apify.com/api/v2",
    keyPlaceholder: "Enter your Apify API token",
    scopes: ["actors", "datasets"],
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    description: "AI web extraction — scrape company sites for contacts and data",
    icon: "F",
    color: "text-orange-400 bg-orange-500/10",
    docsUrl: "https://docs.firecrawl.dev",
    keyPlaceholder: "Enter your Firecrawl API key",
    scopes: ["scrape", "crawl"],
  },
  {
    id: "hunter",
    name: "Hunter.io",
    description: "Email finder + verifier — find business emails from domains",
    icon: "H",
    color: "text-amber-400 bg-amber-500/10",
    docsUrl: "https://hunter.io/api-documentation",
    keyPlaceholder: "Enter your Hunter.io API key",
    scopes: ["domain_search", "email_verifier"],
  },
  {
    id: "proxycurl",
    name: "Proxycurl",
    description: "LinkedIn data — profile info, company pages, job history",
    icon: "P",
    color: "text-cyan-400 bg-cyan-500/10",
    docsUrl: "https://nubela.co/proxycurl/docs",
    keyPlaceholder: "Enter your Proxycurl API key",
    scopes: ["person_profile", "company_profile"],
  },
  {
    id: "abstract",
    name: "Abstract API",
    description: "Validation — verify emails and phone numbers are real",
    icon: "Ab",
    color: "text-purple-400 bg-purple-500/10",
    docsUrl: "https://www.abstractapi.com/api/email-verification-validation-api",
    keyPlaceholder: "Enter your Abstract API key",
    scopes: ["email_validation", "phone_validation"],
  },
];

interface ProviderCardProps {
  config: ProviderConfig;
  entry?: VaultEntry;
  onSave: (provider: string, key: string, label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTest: (id: string) => Promise<{ success: boolean; message: string }>;
}

export function ProviderCard({ config, entry, onSave, onDelete, onTest }: ProviderCardProps) {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState(false);

  const isConnected = entry && entry.status === "active";

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await onSave(config.id, keyInput.trim(), config.name);
      setKeyInput("");
      setEditing(false);
      toast.success(`${config.name} connected`);
    } catch {
      toast.error(`Failed to save ${config.name} key`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!entry) return;
    setTesting(true);
    try {
      const result = await onTest(entry.id);
      if (result.success) {
        toast.success(`${config.name}: ${result.message}`);
      } else {
        toast.error(`${config.name}: ${result.message}`);
      }
    } catch {
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (!window.confirm(`Revoke ${config.name} API key? This won't delete any enriched data.`)) return;
    try {
      await onDelete(entry.id);
      toast.success(`${config.name} disconnected`);
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-surface p-5 transition-all hover:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">{config.name}</h3>
              <a href={config.docsUrl} target="_blank" rel="noopener noreferrer" className="text-text-disabled hover:text-text-muted">
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-text-muted leading-tight">{config.description}</p>
          </div>
        </div>
        {isConnected ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-success">
            <CheckCircle className="w-3 h-3" /> Active
          </span>
        ) : entry?.status === "error" ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-error">
            <AlertTriangle className="w-3 h-3" /> Error
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-text-disabled">
            <XCircle className="w-3 h-3" /> Not connected
          </span>
        )}
      </div>

      {/* Connected state */}
      {isConnected && !editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#0A0A0A] px-3 py-2">
            <code className="flex-1 text-xs text-text-muted font-mono">{entry.maskedKey}</code>
            <button onClick={() => setEditing(true)} className="text-[10px] text-text-muted hover:text-cyan-400 transition-colors">
              Edit
            </button>
            <button onClick={handleDelete} className="text-text-muted hover:text-error transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {entry.lastUsedAt && (
            <p className="text-[10px] text-text-disabled">Last used: {new Date(entry.lastUsedAt).toLocaleDateString()}</p>
          )}
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-text-secondary hover:bg-elevated transition-colors disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>
      ) : (
        /* Not connected or editing */
        <div className="space-y-2 mt-2">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              placeholder={config.keyPlaceholder}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full h-9 px-3 pr-9 rounded-lg text-xs bg-[#0A0A0A] border border-white/10 text-text-primary placeholder:text-text-disabled outline-none focus:border-cyan-500/30 font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-muted"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!keyInput.trim() || saving}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {saving ? "Encrypting..." : entry ? "Update Key" : "Connect"}
            </button>
            {editing && (
              <button
                onClick={() => { setEditing(false); setKeyInput(""); }}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="text-[10px] text-text-disabled flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Encrypted with AES-256-GCM. Only decrypted server-side when making API calls.
          </p>
        </div>
      )}
    </div>
  );
}
