"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ContentProject } from "@/lib/db/schema";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: ContentProject) => void;
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: NewProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const project = await res.json();
      onCreated(project);
      setTitle("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-surface border border-border rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-heading text-lg font-semibold text-text-primary">
              New Project
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-text-dim mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q1 Blog — Digital Marketing Trends"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />

            <div className="flex justify-end gap-2 mt-5">
              <Dialog.Close className="px-4 py-2 rounded-lg text-sm text-text-dim hover:text-text-primary hover:bg-surface-2 transition-colors">
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={!title.trim() || loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-bg hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
