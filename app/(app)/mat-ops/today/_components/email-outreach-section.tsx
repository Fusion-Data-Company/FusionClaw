"use client";

import { useState, useTransition } from "react";
import { GlassCard } from "@/components/primitives/GlassCard";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Mail, Info, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { createEmailOutreach, deleteEmailOutreach } from "../_actions";

interface EmailOutreachEntry {
    id: string;
    recipient: string;
    subject: string | null;
    sentAt: string;
    quantity: number;
    notes: string | null;
}

interface Props {
    shiftId: string;
    entries: EmailOutreachEntry[];
    disabled?: boolean;
}

export function EmailOutreachSection({ shiftId, entries, disabled }: Props) {
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [recipient, setRecipient] = useState("");
    const [subject, setSubject] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState("");

    const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);

    const handleAdd = () => {
        if (!recipient.trim()) return;
        startTransition(async () => {
            try {
                await createEmailOutreach({
                    shiftId,
                    recipient: recipient.trim(),
                    subject: subject.trim() || null,
                    sentAt: new Date().toISOString(),
                    quantity,
                    notes: notes.trim() || null,
                });
                setRecipient("");
                setSubject("");
                setQuantity(1);
                setNotes("");
                setShowForm(false);
                toast.success("Email logged");
            } catch {
                toast.error("Failed to log email");
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteEmailOutreach({ id });
                toast.success("Entry removed");
            } catch {
                toast.error("Failed to remove");
            }
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-purple-400" />
                Email Outreach
            </h2>
            <div className="flex items-start gap-3 rounded-lg border border-purple-500/10 bg-purple-500/[0.03] px-4 py-3">
                <Info className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                    <strong className="text-purple-300">What to do:</strong> Log each email batch you send — who it went to, how many, and any notes.
                </p>
            </div>

            <GlassCard className="p-5 space-y-4">
                {/* Summary */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-purple-400" />
                            <span className="text-sm font-medium">Today's Emails</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-mono text-purple-400">
                                <Send className="h-3 w-3" />
                                {totalQuantity} sent
                            </span>
                            <span className="inline-flex items-center rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
                                {entries.length} batch{entries.length !== 1 ? "es" : ""}
                            </span>
                        </div>
                    </div>
                    {!disabled && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowForm((p) => !p)}
                            className="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Log Email
                        </motion.button>
                    )}
                </div>

                {/* Add Form */}
                {showForm && !disabled && (
                    <div className="space-y-3 rounded-lg border border-purple-500/10 bg-purple-500/[0.02] p-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase">Recipient / List *</label>
                                <input
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="e.g. SaaS founders list"
                                    autoFocus
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase">Subject / Campaign</label>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Q1 outreach"
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase">Quantity</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-muted-foreground uppercase">Notes</label>
                                <input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Optional notes"
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={isPending || !recipient.trim()}
                                className="rounded-lg bg-purple-500 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                            >
                                {isPending ? "Saving..." : "Log"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Entries */}
                {entries.length > 0 && (
                    <div className="space-y-1">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02] transition-colors text-sm"
                            >
                                <span className="text-[10px] text-muted-foreground font-mono w-14 shrink-0">
                                    {new Date(entry.sentAt).toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                        timeZone: "America/Los_Angeles",
                                    })}
                                </span>
                                <span className="flex-1 truncate">
                                    {entry.recipient}
                                    {entry.subject && (
                                        <span className="text-muted-foreground"> — {entry.subject}</span>
                                    )}
                                </span>
                                <span className="text-xs font-mono text-purple-400 shrink-0">
                                    x{entry.quantity}
                                </span>
                                {entry.notes && (
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                        {entry.notes}
                                    </span>
                                )}
                                {!disabled && (
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="rounded p-1 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {entries.length === 0 && !showForm && (
                    <p className="text-xs text-muted-foreground/50 text-center py-3">
                        No emails logged today
                    </p>
                )}
            </GlassCard>
        </div>
    );
}
