"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.08) 0%, transparent 55%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-36 h-36 rounded-2xl overflow-hidden mb-4"
            style={{ boxShadow: "0 0 40px rgba(59,130,246,0.12)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fusionclaw-logo.png"
              alt="FusionClaw"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FusionClaw
          </h1>
          <p className="text-sm text-text-muted mt-1">Enter your gateway password</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Gateway password"
              autoFocus
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-all bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-error px-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-11 rounded-xl text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-xs text-text-disabled text-center mt-6">
          Set GATEWAY_PASSWORD in your .env.local
        </p>
      </div>
    </div>
  );
}
