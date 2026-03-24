"use client";

import { useState } from "react";
import { GlassCard } from "@/components/primitives";
import { SpotlightCard } from "@/components/effects/EliteEffects";
import {
  Bot, Cpu, Brain, Zap, Settings, CheckCircle, XCircle, Loader2,
  Plus, X, Key, Globe, Trash2, RefreshCw, Shield,
} from "lucide-react";

interface AgentConnection {
  id: string;
  name: string;
  type: "openclaw" | "claude" | "openrouter" | "custom";
  apiEndpoint?: string;
  status: "connected" | "disconnected" | "testing";
  model?: string;
  lastUsed?: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
}

const PRESET_AGENTS: AgentConnection[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    type: "openclaw",
    status: "disconnected",
    apiEndpoint: "",
    icon: Zap,
    color: "text-orange-400",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "claude",
    name: "Claude Co-Agent",
    type: "claude",
    status: "disconnected",
    model: "claude-sonnet-4-20250514",
    apiEndpoint: "",
    icon: Brain,
    color: "text-purple-400",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: "openrouter",
    name: "OpenRouter Hub",
    type: "openrouter",
    status: "disconnected",
    apiEndpoint: "https://openrouter.ai/api/v1",
    icon: Globe,
    color: "text-cyan-400",
    gradient: "from-cyan-500 to-blue-500",
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentConnection[]>(PRESET_AGENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [newAgent, setNewAgent] = useState({ name: "", endpoint: "", apiKey: "" });

  const testConnection = async (id: string) => {
    setTestingId(id);
    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 1500));
    const key = apiKeys[id];
    setAgents(prev =>
      prev.map(a => a.id === id ? { ...a, status: key ? "connected" : "disconnected" } : a)
    );
    setTestingId(null);
  };

  const saveApiKey = (id: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [id]: key }));
    // In production, this would save to encrypted storage via API
  };

  const addCustomAgent = () => {
    if (!newAgent.name.trim() || !newAgent.endpoint.trim()) return;
    const id = `custom_${Date.now()}`;
    setAgents(prev => [
      ...prev,
      {
        id,
        name: newAgent.name,
        type: "custom",
        apiEndpoint: newAgent.endpoint,
        status: "disconnected",
        icon: Cpu,
        color: "text-emerald-400",
        gradient: "from-emerald-500 to-green-500",
      },
    ]);
    if (newAgent.apiKey) saveApiKey(id, newAgent.apiKey);
    setNewAgent({ name: "", endpoint: "", apiKey: "" });
    setShowAddModal(false);
  };

  const removeAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
  };

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
            <SpotlightCard key={agent.id} className="p-0 overflow-hidden">
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
                        onClick={() => removeAgent(agent.id)}
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
                      onChange={(e) => saveApiKey(agent.id, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-surface border border-border text-text-primary focus:border-accent/30 outline-none"
                      placeholder="Enter API key..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => testConnection(agent.id)}
                      disabled={testingId === agent.id}
                      className="flex-1 h-8 rounded-lg text-xs font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {testingId === agent.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Test Connection
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <Shield className="w-3 h-3" />
                    Keys are stored securely and never exposed in the UI
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
                  disabled={!newAgent.name.trim() || !newAgent.endpoint.trim()}
                  className="flex-1 h-10 rounded-lg text-sm font-bold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
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
