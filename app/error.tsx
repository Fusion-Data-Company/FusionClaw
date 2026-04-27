"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#050505",
        color: "#F8F5F0",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "560px", padding: "32px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <pre
          style={{
            fontSize: "13px",
            color: "#8A8580",
            marginBottom: "24px",
            whiteSpace: "pre-wrap",
            textAlign: "left",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            padding: "12px 14px",
          }}
        >
          {error.message || "An unexpected error occurred."}
        </pre>
        <button
          onClick={reset}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            background: "rgba(59,130,246,0.2)",
            color: "#93C5FD",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
