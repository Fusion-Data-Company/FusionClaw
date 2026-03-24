"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/primitives";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="p-8 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-sm text-text-muted mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </GlassCard>
    </div>
  );
}
