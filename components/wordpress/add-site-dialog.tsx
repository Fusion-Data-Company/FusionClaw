"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function AddSiteDialog({
  open,
  onOpenChange,
  onCreated,
}: AddSiteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      siteName: form.get("siteName") as string,
      siteUrl: form.get("siteUrl") as string,
      wpUsername: form.get("wpUsername") as string,
      wpAppPassword: form.get("wpAppPassword") as string,
      clientName: form.get("clientName") as string || undefined,
      clientIndustry: form.get("clientIndustry") as string || undefined,
      clientNotes: form.get("clientNotes") as string || undefined,
      description: form.get("description") as string || undefined,
    };

    try {
      const res = await fetch("/api/wordpress/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add site");
        return;
      }

      if (data.connectionResult?.success) {
        toast.success(
          `${data.siteName} connected! Found ${data.connectionResult.categoryCount} categories.`
        );
      } else {
        toast.warning(
          `${data.siteName} added but connection failed: ${data.connectionResult?.error || "Unknown error"}. You can test again later.`
        );
      }

      onOpenChange(false);
      onCreated?.();
    } catch {
      toast.error("Failed to add site");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-border rounded-xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-accent" />
              <Dialog.Title className="font-heading font-semibold text-lg text-text-primary">
                Add WordPress Site
              </Dialog.Title>
            </div>
            <Dialog.Close className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-primary transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Site Info */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
                WordPress Site
              </legend>

              <div>
                <label className="text-xs text-text-dim mb-1 block">
                  Site Name *
                </label>
                <input
                  name="siteName"
                  required
                  placeholder="Client Blog"
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-dim mb-1 block">
                  WordPress URL *
                </label>
                <input
                  name="siteUrl"
                  required
                  type="url"
                  placeholder="https://clientblog.com"
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-dim mb-1 block">
                  Description
                </label>
                <input
                  name="description"
                  placeholder="Main company blog"
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </fieldset>

            {/* Credentials */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
                API Credentials
              </legend>

              <div>
                <label className="text-xs text-text-dim mb-1 block">
                  WordPress Username *
                </label>
                <input
                  name="wpUsername"
                  required
                  placeholder="admin"
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-dim mb-1 block">
                  Application Password *
                </label>
                <input
                  name="wpAppPassword"
                  required
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Generate at wp-admin → Users → Profile → Application Passwords
                </p>
              </div>
            </fieldset>

            {/* Client Info */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
                Client Info (Optional)
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-dim mb-1 block">
                    Client Name
                  </label>
                  <input
                    name="clientName"
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-dim mb-1 block">
                    Industry
                  </label>
                  <input
                    name="clientIndustry"
                    placeholder="Technology"
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-dim mb-1 block">
                  Notes
                </label>
                <textarea
                  name="clientNotes"
                  rows={2}
                  placeholder="Brand voice notes, special instructions..."
                  className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
                />
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-lg text-sm text-text-dim hover:text-text-primary hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-accent text-bg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Connecting..." : "Add & Test Connection"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
