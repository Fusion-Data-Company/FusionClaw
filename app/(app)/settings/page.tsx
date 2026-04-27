"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/primitives";
import {
  Settings,
  Cpu,
  Image as ImageIcon,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bell,
  Shield,
  KeyRound,
} from "lucide-react";
import { GoogleConnectCard } from "@/components/google/google-connect-card";
import { ProviderCard, PROVIDERS, type VaultEntry } from "@/components/vault/provider-card";

const AI_MODELS = [
  { value: "perplexity/sonar", label: "Perplexity Sonar", provider: "Perplexity", tier: "mid" },
  { value: "perplexity/sonar-pro", label: "Perplexity Sonar Pro", provider: "Perplexity", tier: "premium" },
  { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku", provider: "Anthropic", tier: "budget" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic", tier: "premium" },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI", tier: "budget" },
  { value: "openai/gpt-4.1", label: "GPT-4.1", provider: "OpenAI", tier: "premium" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tier: "budget" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", tier: "premium" },
];

const IMAGE_MODELS = [
  { value: "fal-ai/nano-banana-pro", label: "Nano Banana Pro", note: "Google Imagen" },
  { value: "fal-ai/flux/schnell", label: "FLUX Schnell", note: "Fast generation" },
  { value: "fal-ai/flux-2-pro", label: "FLUX.2 Pro", note: "Premium quality" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1", desc: "Square" },
  { value: "16:9", label: "16:9", desc: "Wide" },
  { value: "9:16", label: "9:16", desc: "Tall" },
  { value: "4:3", label: "4:3", desc: "Standard" },
];

const TONES = ["professional", "casual", "technical", "conversational", "academic", "persuasive"];

const TEMP_LABELS = [
  { value: 0.2, label: "Precise" },
  { value: 0.5, label: "Balanced" },
  { value: 0.7, label: "Creative" },
  { value: 1.0, label: "Wild" },
];

interface SettingsState {
  chatModel: string;
  chatTemperature: number;
  chatMaxTokens: number;
  defaultImageModel: string;
  defaultAspectRatio: string;
  defaultContentTone: string;
  targetWordCount: number;
  autoGenerateImages: boolean;
  autoGenerateInfographic: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
  tipsEnabled: boolean;
  onboardingEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    chatModel: "anthropic/claude-sonnet-4",
    chatTemperature: 0.7,
    chatMaxTokens: 16000,
    defaultImageModel: "fal-ai/flux-2-pro",
    defaultAspectRatio: "16:9",
    defaultContentTone: "professional",
    targetWordCount: 2000,
    autoGenerateImages: true,
    autoGenerateInfographic: true,
    emailNotifications: true,
    slackNotifications: false,
    tipsEnabled: true,
    onboardingEnabled: true,
  });

  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);

  // Load vault entries
  useEffect(() => {
    fetch("/api/vault").then(r => r.json()).then(d => setVaultEntries(d.providers || [])).catch(() => {});
  }, []);

  const handleVaultSave = async (provider: string, key: string, label: string) => {
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key, label }),
    });
    if (!res.ok) throw new Error("Failed to save");
    const data = await res.json();
    setVaultEntries(prev => {
      const existing = prev.findIndex(p => p.provider === provider);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = data.entry;
        return updated;
      }
      return [...prev, data.entry];
    });
  };

  const handleVaultDelete = async (id: string) => {
    const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    setVaultEntries(prev => prev.filter(p => p.id !== id));
  };

  const handleVaultTest = async (id: string) => {
    const res = await fetch(`/api/vault/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test" }),
    });
    return res.json();
  };

  // Load settings from DB on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings((prev) => ({
            ...prev,
            chatModel: data.chatModel || prev.chatModel,
            chatTemperature: parseFloat(data.chatTemperature) || prev.chatTemperature,
            chatMaxTokens: data.chatMaxTokens || prev.chatMaxTokens,
            defaultImageModel: data.defaultImageModel || prev.defaultImageModel,
            tipsEnabled: data.tipsEnabled !== false,
            onboardingEnabled: data.onboardingEnabled !== false,
          }));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Debounced save to DB
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const saveToDb = useCallback((partial: Partial<SettingsState>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      try {
        const dbFields: Record<string, unknown> = {};
        if ("chatModel" in partial) dbFields.chatModel = partial.chatModel;
        if ("chatTemperature" in partial) dbFields.chatTemperature = String(partial.chatTemperature);
        if ("chatMaxTokens" in partial) dbFields.chatMaxTokens = partial.chatMaxTokens;
        if ("defaultImageModel" in partial) dbFields.defaultImageModel = partial.defaultImageModel;
        if ("tipsEnabled" in partial) dbFields.tipsEnabled = partial.tipsEnabled;
        if ("onboardingEnabled" in partial) dbFields.onboardingEnabled = partial.onboardingEnabled;
        if (Object.keys(dbFields).length > 0) {
          await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dbFields),
          });
        }
      } catch { /* silent */ } finally { setSaving(false); }
    }, 800);
  }, []);

  const update = (partial: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    saveToDb(partial);
  };

  const tempLabel = TEMP_LABELS.reduce((prev, curr) =>
    Math.abs(curr.value - settings.chatTemperature) < Math.abs(prev.value - settings.chatTemperature) ? curr : prev
  ).label;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>
          <p className="text-sm text-text-muted">Configure AI models, image generation, and preferences</p>
        </div>
      </div>

      {/* Service Status */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Service Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "OpenRouter", desc: "AI Generation", connected: true },
            { label: "fal.ai", desc: "Image Generation", connected: true },
            { label: "Neon DB", desc: "PostgreSQL", connected: true },
            { label: "MCP Server", desc: "Agent Access", connected: true },
          ].map((svc) => (
            <GlassCard key={svc.label} padding="md">
              <div className="flex items-center gap-2 mb-1">
                {svc.connected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-error" />
                )}
                <span className="text-xs font-medium text-text-primary">{svc.label}</span>
              </div>
              <p className="text-[10px] text-text-muted">{svc.desc}</p>
              <p className={`text-[10px] mt-1 font-medium ${svc.connected ? "text-success" : "text-error"}`}>
                {svc.connected ? "Connected" : "Not configured"}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Google Workspace Integration */}
      <GoogleConnectCard />

      {/* API Keys & Integrations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted">API Keys & Integrations</h2>
        </div>
        <p className="text-[11px] text-text-disabled mb-4">
          Connect services to power your workflows. Sign up through our links to support FusionClaw. Keys are encrypted with AES-256-GCM and never exposed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROVIDERS.map((config) => (
            <ProviderCard
              key={config.id}
              config={config}
              entry={vaultEntries.find((v) => v.provider === config.id)}
              onSave={handleVaultSave}
              onDelete={handleVaultDelete}
              onTest={handleVaultTest}
            />
          ))}
        </div>
      </div>

      {/* AI Configuration */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">AI Configuration</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-text-primary block mb-2">Chat Model</label>
            <select
              value={settings.chatModel}
              onChange={(e) => update({ chatModel: e.target.value })}
              className="w-full max-w-md bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/30"
            >
              {AI_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.provider}){m.tier === "premium" ? " \u2605" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-primary block mb-2">
              Creativity Level
              <span className="ml-2 text-accent font-normal">{settings.chatTemperature.toFixed(1)} — {tempLabel}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.chatTemperature}
              onChange={(e) => update({ chatTemperature: parseFloat(e.target.value) })}
              className="w-full max-w-md accent-accent h-1.5 bg-elevated rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between max-w-md mt-1">
              {TEMP_LABELS.map((t) => (
                <span key={t.value} className="text-[10px] text-text-muted">{t.label}</span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-primary block mb-2">Max Output Length</label>
            <div className="flex gap-2 max-w-md">
              {[
                { label: "8K", value: 8000 },
                { label: "16K", value: 16000 },
                { label: "32K", value: 32000 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ chatMaxTokens: opt.value })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    settings.chatMaxTokens === opt.value
                      ? "border-accent/50 bg-accent/5 text-accent"
                      : "border-border text-text-muted hover:text-text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Image Generation */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">Image Generation</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-text-primary block mb-2">Default Image Model</label>
            <select
              value={settings.defaultImageModel}
              onChange={(e) => update({ defaultImageModel: e.target.value })}
              className="w-full max-w-md bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/30"
            >
              {IMAGE_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label} — {m.note}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-primary block mb-2">Default Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.value}
                  onClick={() => update({ defaultAspectRatio: ar.value })}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    settings.defaultAspectRatio === ar.value
                      ? "border-accent/50 bg-accent/5 text-accent"
                      : "border-border text-text-muted hover:text-text-primary"
                  }`}
                >
                  {ar.label} <span className="text-text-muted ml-1">{ar.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <ToggleRow
              label="Auto-generate hero images"
              description="Automatically create images when AI includes image prompts"
              checked={settings.autoGenerateImages}
              onChange={(v) => update({ autoGenerateImages: v })}
            />
            <ToggleRow
              label="Auto-generate infographic"
              description="Automatically analyze blog content and generate an infographic"
              checked={settings.autoGenerateInfographic}
              onChange={(v) => update({ autoGenerateInfographic: v })}
            />
          </div>
        </div>
      </GlassCard>

      {/* Content Defaults */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">Content Defaults</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-text-primary block mb-2">Default Content Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => update({ defaultContentTone: tone })}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors capitalize cursor-pointer ${
                    settings.defaultContentTone === tone
                      ? "border-accent/50 bg-accent/5 text-accent"
                      : "border-border text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-primary block mb-2">
              Target Word Count
              <span className="ml-2 text-accent font-normal">{settings.targetWordCount.toLocaleString()} words</span>
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={settings.targetWordCount}
              onChange={(e) => update({ targetWordCount: parseInt(e.target.value) })}
              className="w-full max-w-md accent-accent h-1.5 bg-elevated rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between max-w-md mt-1">
              <span className="text-[10px] text-text-muted">500</span>
              <span className="text-[10px] text-text-muted">2,500</span>
              <span className="text-[10px] text-text-muted">5,000</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-text-primary">Notifications</h2>
        </div>
        <div className="space-y-3">
          <ToggleRow
            label="Email notifications"
            description="Receive email alerts for campaign completions and task deadlines"
            checked={settings.emailNotifications}
            onChange={(v) => update({ emailNotifications: v })}
          />
          <ToggleRow
            label="Slack notifications"
            description="Push updates to your connected Slack workspace"
            checked={settings.slackNotifications}
            onChange={(v) => update({ slackNotifications: v })}
          />
        </div>
      </GlassCard>

      {/* Onboarding & Tips */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-text-primary">Onboarding & Tips</h2>
        </div>
        <div className="space-y-3">
          <ToggleRow
            label="Show tips"
            description="Contextual hint cards appear on pages to teach the platform. Turn off for a cleaner workspace."
            checked={settings.tipsEnabled}
            onChange={(v) => update({ tipsEnabled: v })}
          />
          <ToggleRow
            label="Show onboarding flow"
            description="The first-run welcome modal that introduces Wiki Brain, Skills, and the Binding Interview."
            checked={settings.onboardingEnabled}
            onChange={(v) => update({ onboardingEnabled: v })}
          />
          <a
            href="/onboarding/interview"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 mt-2"
          >
            Run the Binding Interview again →
          </a>
        </div>
      </GlassCard>

      {/* Data Management */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-error" />
          <h2 className="text-sm font-bold text-text-primary">Data Management</h2>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-sm text-text-primary font-medium">Export Settings</p>
              <p className="text-[10px] text-text-muted mt-0.5">Download current settings as JSON</p>
            </div>
            <button className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-text-primary hover:bg-elevated transition-colors flex items-center gap-2 cursor-pointer shrink-0 w-fit">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          <div className="border-t border-border" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-sm text-text-primary font-medium">Clear Chat History</p>
              <p className="text-[10px] text-text-muted mt-0.5">Delete all chat messages. Projects and content preserved.</p>
            </div>
            <button className="px-4 py-2 rounded-lg border border-error/20 text-xs font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-2 cursor-pointer shrink-0 w-fit">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <div className="border-t border-border" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-sm text-text-primary font-medium flex items-center gap-2">
                Delete All Data
                <AlertTriangle className="w-3.5 h-3.5 text-error" />
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">Permanently delete all projects, content, and images. Cannot be undone.</p>
            </div>
            <button className="px-4 py-2 rounded-lg border border-error/20 text-xs font-medium text-error hover:bg-error/10 transition-colors flex items-center gap-2 cursor-pointer shrink-0 w-fit">
              <Trash2 className="w-3.5 h-3.5" /> Delete All
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-text-primary">{label}</p>
        <p className="text-[10px] text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-accent" : "bg-elevated"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-5 bg-bg" : "translate-x-0.5 bg-text-muted"}`} />
      </button>
    </div>
  );
}
