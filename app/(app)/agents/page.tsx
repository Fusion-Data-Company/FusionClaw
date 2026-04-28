"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import { toast } from "sonner";
import {
  Bot, Cpu, Brain, Zap, Settings, CheckCircle, XCircle, Loader2,
  Plus, X, Key, Globe, Trash2, RefreshCw, Shield,
} from "lucide-react";

interface VaultEntry {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  status: string;
  lastUsedAt: string | null;
  scopes: string[];
  baseUrl: string | null;
  createdAt: string;
}

interface AgentConnection {
  id: string;
  vaultId?: string;
  name: string;
  type: "openclaw" | "claude" | "openrouter" | "custom";
  apiEndpoint?: string;
  status: "connected" | "disconnected" | "testing";
  model?: string;
  lastUsed?: string;
  maskedKey?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  gradient: string;
}

const AGENT_META: Record<string, { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; gradient: string; model?: string; endpoint?: string }> = {
  openclaw: { icon: Zap, color: "text-orange-400", gradient: "from-orange-500 to-amber-500" },
  claude: { icon: Brain, color: "text-purple-400", gradient: "from-purple-500 to-violet-500", model: "claude-sonnet-4-20250514" },
  openrouter: { icon: Globe, color: "text-cyan-400", gradient: "from-cyan-500 to-blue-500", endpoint: "https://openrouter.ai/api/v1" },
  custom: { icon: Cpu, color: "text-emerald-400", gradient: "from-emerald-500 to-green-500" },
};

const PRESET_TYPES = ["openclaw", "claude", "openrouter"] as const;

function vaultToAgent(entry: VaultEntry): AgentConnection {
  const meta = AGENT_META[entry.provider] || AGENT_META.custom;
  return {
    id: entry.provider,
    vaultId: entry.id,
    name: entry.label,
    type: (PRESET_TYPES.includes(entry.provider as typeof PRESET_TYPES[number]) ? entry.provider : "custom") as AgentConnection["type"],
    apiEndpoint: entry.baseUrl || meta.endpoint || "",
    status: entry.status === "active" ? "connected" : "disconnected",
    model: meta.model,
    lastUsed: entry.lastUsedAt || undefined,
    maskedKey: entry.maskedKey,
    icon: meta.icon,
    color: meta.color,
    gradient: meta.gradient,
  };
}

function buildPresetAgents(vaultAgents: AgentConnection[]): AgentConnection[] {
  const vaultProviders = new Set(vaultAgents.map((a) => a.type));
  const presets: AgentConnection[] = PRESET_TYPES
    .filter((t) => !vaultProviders.has(t))
    .map((type) => {
      const meta = AGENT_META[type];
      return {
        id: type,
        name: type === "openclaw" ? "OpenClaw" : type === "claude" ? "Claude Co-Agent" : "OpenRouter Hub",
        type,
        apiEndpoint: meta.endpoint || "",
        status: "disconnected" as const,
        model: meta.model,
        icon: meta.icon,
        color: meta.color,
        gradient: meta.gradient,
      };
    });
  return [...vaultAgents, ...presets];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({ name: "", endpoint: "", apiKey: "" });

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/vault");
      const data = await res.json();
      const agentProviders = ["openclaw", "claude", "openrouter", "custom"];
      const vaultAgents: AgentConnection[] = (data.providers || [])
        .filter((e: VaultEntry) => agentProviders.includes(e.provider) && e.status !== "revoked")
        .map(vaultToAgent);
      setAgents(buildPresetAgents(vaultAgents));
    } catch {
      // Vault unavailable — show presets only
      setAgents(buildPresetAgents([]));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const saveApiKey = async (agent: AgentConnection, key: string) => {
    if (!key.trim()) return;
    setSavingId(agent.id);
    try {
      if (agent.vaultId) {
        // Update existing vault entry
        const res = await fetch(`/api/vault/${agent.vaultId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, status: "active" }),
        });
        if (!res.ok) throw new Error("Failed to update key");
        toast.success(`${agent.name} key updated`);
      } else {
        // Create new vault entry
        const res = await fetch("/api/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: agent.type,
            label: agent.name,
            key,
            baseUrl: agent.apiEndpoint || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || "Failed to save key");
          return;
        }
        toast.success(`${agent.name} key saved`);
      }
      setApiKeys((prev) => ({ ...prev, [agent.id]: "" }));
      await fetchAgents();
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSavingId(null);
    }
  };

  const testConnection = async (agent: AgentConnection) => {
    if (!agent.vaultId) {
      toast.error("Save an API key first");
      return;
    }
    setTestingId(agent.id);
    try {
      const res = await fetch(`/api/vault/${agent.vaultId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Connection verified");
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? { ...a, status: "connected" } : a)),
        );
      } else {
        toast.error(data.message || "Connection test failed");
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? { ...a, status: "disconnected" } : a)),
        );
      }
    } catch {
      toast.error("Connection test failed");
    } finally {
      setTestingId(null);
    }
  };

  const removeAgent = async (agent: AgentConnection) => {
    if (agent.vaultId) {
      try {
        const res = await fetch(`/api/vault/${agent.vaultId}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error("Failed to remove agent");
          return;
        }
        toast.success(`${agent.name} removed`);
      } catch {
        toast.error("Failed to remove agent");
        return;
      }
    }
    await fetchAgents();
  };

  const addCustomAgent = async () => {
    if (!newAgent.name.trim() || !newAgent.endpoint.trim()) return;
    setSavingId("new");
    try {
      if (newAgent.apiKey.trim()) {
        const res = await fetch("/api/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "custom",
            label: newAgent.name.trim(),
            key: newAgent.apiKey.trim(),
            baseUrl: newAgent.endpoint.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || "Failed to add agent");
          return;
        }
        toast.success("Custom agent added");
      } else {
        // No key — just add to local state for now; user can configure later
        setAgents((prev) => [
          ...prev,
          {
            id: `custom_${Date.now()}`,
            name: newAgent.name.trim(),
            type: "custom",
            apiEndpoint: newAgent.endpoint.trim(),
            status: "disconnected",
            icon: Cpu,
            color: "text-emerald-400",
            gradient: "from-emerald-500 to-green-500",
          },
        ]);
        toast.success("Custom agent added — save an API key to persist");
      }
      setNewAgent({ name: "", endpoint: "", apiKey: "" });
      setShowAddModal(false);
      await fetchAgents();
    } catch {
      toast.error("Failed to add agent");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Agent Connections
          </h1>
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
            Agent Connections
          </h1>
          <p className="text-sm text-text-muted">
            Connect AI agents and APIs to extend FusionClaw capabilities
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> Add Agent
        </button>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const AgentIcon = agent.icon;
          const isExpanded = configuring === agent.id;
          return (
            <SpotlightCard key={agent.vaultId || agent.id} className="p-0 overflow-hidden">
              <div className="p-4">
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center`}
                      style={{ boxShadow: `0 0 15px ${agent.color.includes("orange") ? "rgba(251,146,60,0.3)" : agent.color.includes("purple") ? "rgba(167,139,250,0.3)" : agent.color.includes("cyan") ? "rgba(34,211,238,0.3)" : "rgba(52,211,153,0.3)"}` }}
                    >
                      <AgentIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{agent.name}</h3>
                      <div className="flex items-center gap-1.5">
                        {agent.status === "connected" ? (
                          <CheckCircle className="w-3 h-3 text-success" />
                        ) : agent.status === "testing" ? (
                          <Loader2 className="w-3 h-3 text-accent animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3 text-text-disabled" />
                        )}
                        <span className={`text-[10px] font-bold uppercase ${
                          agent.status === "connected" ? "text-success" : agent.status === "testing" ? "text-accent" : "text-text-muted"
                        }`}>
                          {agent.status}
                        </span>
                        {agent.maskedKey && (
                          <span className="text-[10px] text-text-disabled ml-1">{agent.maskedKey}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setConfiguring(isExpanded ? null : agent.id)}
                      className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-accent cursor-pointer"
                      title="Configure"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    {agent.type === "custom" && (
                      <button
                        onClick={() => removeAgent(agent)}
                        className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-error cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Model / Endpoint info */}
                {agent.model && (
                  <div className="text-[10px] text-text-muted mb-1">
                    <Cpu className="w-2.5 h-2.5 inline -mt-0.5 mr-1" />Model: {agent.model}
                  </div>
                )}
                {agent.apiEndpoint && (
                  <div className="text-[10px] text-text-muted truncate">
                    <Globe className="w-2.5 h-2.5 inline -mt-0.5 mr-1" />{agent.apiEndpoint}
                  </div>
                )}
              </div>

              {/* Configuration Panel */}
              {isExpanded && (
                <div className="border-t border-border p-4 bg-elevated/50 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 block">
                      <Key className="w-3 h-3 inline -mt-0.5 mr-1" />API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeys[agent.id] || ""}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, [agent.id]: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                      placeholder={agent.maskedKey ? `Current: ${agent.maskedKey}` : "Enter API key..."}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveApiKey(agent, apiKeys[agent.id] || "")}
                      disabled={savingId === agent.id || !apiKeys[agent.id]?.trim()}
                      className="flex-1 h-8 rounded-lg text-xs font-bold bg-surface text-text-primary border border-border hover:bg-elevated disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {savingId === agent.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
                      Save Key
                    </button>
                    <button
                      onClick={() => testConnection(agent)}
                      disabled={testingId === agent.id || !agent.vaultId}
                      className="flex-1 h-8 rounded-lg text-xs font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {testingId === agent.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Test Connection
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <Shield className="w-3 h-3" />
                    Keys are encrypted in the vault and never exposed in the UI
                  </div>
                </div>
              )}
            </SpotlightCard>
          );
        })}
      </div>

      {/* Add Custom Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <GlassCard padding="lg" className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Add Custom Agent</h2>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Agent Name</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="My Custom Agent"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">API Endpoint</label>
                <input
                  type="url"
                  value={newAgent.endpoint}
                  onChange={(e) => setNewAgent({ ...newAgent, endpoint: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="https://api.example.com/v1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">
                  API Key <span className="text-text-disabled">(optional)</span>
                </label>
                <input
                  type="password"
                  value={newAgent.apiKey}
                  onChange={(e) => setNewAgent({ ...newAgent, apiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                  placeholder="sk-..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-surface text-text-secondary border border-border hover:bg-elevated cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomAgent}
                  disabled={!newAgent.name.trim() || !newAgent.endpoint.trim() || savingId === "new"}
                  className="flex-1 h-10 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {savingId === "new" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Agent
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
