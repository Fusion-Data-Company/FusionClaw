"use client";

import { useState, useEffect } from "react";
import { Chrome, CheckCircle, XCircle, RefreshCw, Users, Calendar, Mail, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GoogleIntegration {
  googleEmail: string | null;
  scopes: string[];
  connectedAt: string;
}

export function GoogleConnectCard() {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchStatus();
    // Check URL params for callback result
    const params = new URLSearchParams(window.location.search);
    const googleStatus = params.get("google");
    if (googleStatus === "connected") {
      toast.success("Google account connected successfully");
      window.history.replaceState({}, "", "/settings");
    } else if (googleStatus === "error") {
      toast.error(`Google connection failed: ${params.get("reason") || "unknown"}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/google/status");
      if (res.ok) {
        const data = await res.json();
        setIntegration(data.integration || null);
      }
    } catch {
      // Not connected
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/google/auth";
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Google account? This won't delete any imported leads.")) return;
    try {
      const res = await fetch("/api/google/status", { method: "DELETE" });
      if (res.ok) {
        setIntegration(null);
        toast.success("Google account disconnected");
      }
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const handleSyncContacts = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/google/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Imported ${data.imported} contacts (${data.skipped} skipped)`);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const scopes = [
    { key: "contacts", label: "Contacts", icon: Users, scope: "contacts.readonly" },
    { key: "calendar", label: "Calendar", icon: Calendar, scope: "calendar.readonly" },
    { key: "gmail", label: "Gmail", icon: Mail, scope: "gmail.readonly" },
    { key: "business", label: "Business Profile", icon: Building2, scope: "business.manage" },
  ];

  return (
    <div className="rounded-2xl border border-white/5 bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Chrome className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Google Workspace</h3>
            <p className="text-xs text-text-muted">Connect Google Contacts, Calendar, Gmail, and Business Profile</p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
        ) : integration ? (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle className="w-3.5 h-3.5" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <XCircle className="w-3.5 h-3.5" /> Not connected
          </span>
        )}
      </div>

      {integration ? (
        <>
          <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4 mb-4">
            <div className="text-xs text-text-muted mb-1">Connected as</div>
            <div className="text-sm font-medium text-text-primary">{integration.googleEmail || "Unknown"}</div>
            <div className="text-[10px] text-text-muted mt-1">
              Connected {new Date(integration.connectedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {scopes.map((s) => {
              const hasScope = integration.scopes.some((sc) => sc.includes(s.scope));
              return (
                <div key={s.key} className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#0A0A0A] px-3 py-2">
                  <s.icon className={`w-3.5 h-3.5 ${hasScope ? "text-success" : "text-text-disabled"}`} />
                  <span className={`text-xs ${hasScope ? "text-text-secondary" : "text-text-disabled"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSyncContacts}
              disabled={syncing}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-black hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {syncing ? "Syncing..." : "Import Contacts as Leads"}
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-text-muted hover:text-error hover:border-error/30 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={handleConnect}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-400 transition-colors"
        >
          <Chrome className="w-4 h-4" />
          Connect Google Account
        </button>
      )}
    </div>
  );
}
