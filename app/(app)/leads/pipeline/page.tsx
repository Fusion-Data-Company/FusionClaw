"use client";

import PipelinePro from "@/components/leads/PipelinePro";
import { Kanban } from "lucide-react";

export default function PipelinePage() {
    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                        <Kanban className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Pipeline</h1>
                        <p className="text-sm text-text-muted">Kanban-style lead pipeline</p>
                    </div>
                </div>
            </div>

            {/* Pipeline */}
            <div className="flex-1 min-h-0">
                <PipelinePro />
            </div>
        </div>
    );
}
