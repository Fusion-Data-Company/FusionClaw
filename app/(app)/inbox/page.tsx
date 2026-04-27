"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@/components/primitives";
import { Inbox as InboxIcon, Mail, User, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Email {
  id: string;
  leadId: string | null;
  fromEmail: string;
  fromName: string | null;
  subject: string | null;
  bodyText: string | null;
  receivedAt: string;
  processed: boolean;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Email | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbound-emails");
      const data = await res.json();
      setEmails(data.emails ?? []);
    } catch {/* silent */}
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <InboxIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Inbox</h1>
          <p className="text-xs text-text-muted">Inbound email replies — auto-matched to leads.</p>
        </div>
      </div>

      <GlassCard padding="none" className="flex-1 min-h-0 overflow-hidden flex">
        {/* List */}
        <div className="w-full md:w-[400px] border-r border-border overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
          ) : emails.length === 0 ? (
            <div className="text-center py-16 px-8">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-text-primary mb-1">No emails yet</div>
              <div className="text-[11px] text-text-muted max-w-[260px] mx-auto">
                Configure your email provider (Mailgun, Resend webhook, IMAP) to POST to <code className="bg-surface-2 px-1 rounded text-cyan-300">/api/inbound-emails</code>.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {emails.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setOpen(e)}
                  className={`w-full text-left px-4 py-3 hover:bg-elevated/40 cursor-pointer ${open?.id === e.id ? "bg-cyan-500/5 border-l-2 border-cyan-500/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="text-[12px] font-bold text-text-primary truncate">
                      {e.fromName || e.fromEmail.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono shrink-0">{timeAgo(e.receivedAt)}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary truncate">{e.subject ?? "(no subject)"}</div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">{e.bodyText?.slice(0, 100) ?? ""}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 hidden md:flex flex-col">
          {open ? (
            <>
              <div className="px-5 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-sm font-bold text-text-primary">{open.fromName || open.fromEmail}</span>
                    <span className="text-[10px] text-text-muted font-mono">{open.fromEmail}</span>
                  </div>
                  {open.leadId && (
                    <Link href={`/leads?id=${open.leadId}`} className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer">
                      View lead <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
                <div className="text-[13px] font-bold text-text-primary">{open.subject ?? "(no subject)"}</div>
                <div className="text-[10px] text-text-muted font-mono mt-1">{new Date(open.receivedAt).toLocaleString()}</div>
              </div>
              <div className="flex-1 p-5 overflow-y-auto">
                <pre className="text-[12px] text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">{open.bodyText ?? "(no body)"}</pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted text-[12px]">
              Select an email to read
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
