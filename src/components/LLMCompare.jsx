import { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, Scatter, ZAxis, CartesianGrid, Cell,
} from "recharts";
import MODELS from "../data/models.json";
import { useTheme } from "../context/ThemeContext.jsx";

const PRESETS = [
  { label: "🏆 Frontier Battle", ids: ["gpt5", "opus46", "gemini31pro"] },
  { label: "💰 Best Value", ids: ["sonnet46", "deepseekr1", "qwen3235b", "gpt41"] },
  { label: "⚡ Budget Kings", ids: ["gpt4omini", "gemini25flash", "haiku45", "gptoss20b", "llama4scout"] },
  { label: "🧠 Coding Focus", ids: ["opus46", "gpt5", "deepseekr1", "gemini31pro", "sonnet46"] },
  { label: "🇨🇳 vs 🇺🇸", ids: ["deepseekr1", "qwen3235b", "gpt5", "sonnet46"] },
];

const PROVIDERS = [...new Set(MODELS.map(m => m.provider))];
const TIERS = {
  frontier: { label: "Frontier", color: "#f59e0b", icon: "🏆" },
  mid: { label: "Mid", color: "#6366f1", icon: "⚖️" },
  budget: { label: "Budget", color: "#10b981", icon: "💰" },
};
const BENCHMARKS = ["coding", "mmlu", "gpqa", "math", "swe", "aime"];
const BENCH_LABELS = { coding: "Coding", mmlu: "MMLU", gpqa: "GPQA", math: "MATH 500", swe: "SWE-Bench", aime: "AIME 2024" };

const fmt = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
};
const fmtPrice = (n) => n === null ? "—" : n < 0.01 ? "<$0.01" : "$" + n.toFixed(2);

const MODEL_COLORS = [
  "#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#0ea5e9", "#a855f7", "#22c55e",
];

const Checkbox = ({ checked, color }) => (
  <div
    className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150"
    style={{
      border: `2px solid ${checked ? (color || "#f43f5e") : "var(--checkbox-border)"}`,
      background: checked ? (color || "#f43f5e") : "transparent",
    }}
  >
    {checked && (
      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
        <path d="M1 3.5L4 6.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

export default function LLMCompare() {
  const { theme, toggleTheme, chartColors } = useTheme();
  const [selected, setSelected] = useState(["gpt5", "opus46", "gemini31pro", "sonnet46"]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState(null);
  const [tierFilter, setTierFilter] = useState(null);
  const [view, setView] = useState("table");
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [headerProviderFilter, setHeaderProviderFilter] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (panelOpen && inputRef.current) inputRef.current.focus();
  }, [panelOpen]);

  const toggleModel = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedModels = useMemo(() => {
    let models = MODELS.filter(m => selected.includes(m.id));
    if (sortBy) {
      models.sort((a, b) => {
        const va = a[sortBy] ?? -Infinity;
        const vb = b[sortBy] ?? -Infinity;
        return sortDir === "asc" ? va - vb : vb - va;
      });
    }
    return models;
  }, [selected, sortBy, sortDir]);

  const activeProviders = useMemo(() => {
    const seen = new Set();
    const result = [];
    selectedModels.forEach(m => {
      if (!seen.has(m.provider)) {
        seen.add(m.provider);
        result.push({ name: m.provider, color: m.providerColor });
      }
    });
    return result;
  }, [selectedModels]);

  const displayModels = useMemo(() => {
    if (!headerProviderFilter) return selectedModels;
    return selectedModels.filter(m => m.provider === headerProviderFilter);
  }, [selectedModels, headerProviderFilter]);

  // Auto-reset header provider filter when that provider has no selected models
  useEffect(() => {
    if (headerProviderFilter && !activeProviders.some(p => p.name === headerProviderFilter)) {
      setHeaderProviderFilter(null);
    }
  }, [activeProviders, headerProviderFilter]);

  const filteredModels = useMemo(() => {
    let list = MODELS;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q));
    }
    if (providerFilter) list = list.filter(m => m.provider === providerFilter);
    if (tierFilter) list = list.filter(m => m.tier === tierFilter);
    return list;
  }, [searchQuery, providerFilter, tierFilter]);

  const groupedFilteredModels = useMemo(() => {
    const groups = [];
    let currentProvider = null;
    let currentGroup = null;
    filteredModels.forEach(m => {
      if (m.provider !== currentProvider) {
        currentProvider = m.provider;
        currentGroup = { provider: m.provider, providerColor: m.providerColor, models: [] };
        groups.push(currentGroup);
      }
      currentGroup.models.push(m);
    });
    return groups;
  }, [filteredModels]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir(key === "input" || key === "output" || key === "latency" ? "asc" : "desc"); }
  };

  const bestValues = useMemo(() => {
    const fields = [
      ["input", "min"], ["output", "min"], ["context", "max"],
      ["speed", "max"], ["latency", "min"], ["quality", "max"],
      ...BENCHMARKS.map(b => [b, "max"]),
    ];
    const result = {};
    fields.forEach(([field, mode]) => {
      const vals = displayModels.map(x => x[field]).filter(x => x != null);
      result[field] = vals.length ? (mode === "max" ? Math.max(...vals) : Math.min(...vals)) : null;
    });
    return result;
  }, [displayModels]);

  const benchmarkData = useMemo(() =>
    BENCHMARKS.map(b => {
      const entry = { name: BENCH_LABELS[b] };
      displayModels.forEach(m => { entry[m.id] = m[b]; });
      return entry;
    }), [displayModels]);

  const radarData = useMemo(() =>
    BENCHMARKS.map(b => {
      const entry = { benchmark: BENCH_LABELS[b] };
      displayModels.forEach(m => { entry[m.id] = m[b]; });
      return entry;
    }), [displayModels]);

  const scatterData = useMemo(() =>
    displayModels.map((m) => ({
      name: m.name,
      x: (m.input * 3 + m.output) / 4,
      y: m.quality,
      z: m.speed,
      color: MODEL_COLORS[selected.indexOf(m.id) % MODEL_COLORS.length],
      provider: m.provider,
    })), [displayModels, selected]);

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="opacity-30 text-[10px]">⇅</span>;
    return <span className="text-[10px] text-rose-accent">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 border border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary bg-transparent ml-2"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="font-mono bg-surface-bg text-text-primary min-h-screen flex flex-col">
      {/* HEADER */}
      <div className="px-6 pt-5 border-b border-border-light shrink-0">
        <div className="flex items-center justify-between mb-3.5">
          <div className="font-display text-[20px] font-bold tracking-[-0.5px] flex items-center gap-2">
            <span className="text-rose-accent">⬡</span> LLM Compare
          </div>
          <div className="flex gap-1.5 items-center">
            {[["table", "⊞ Table"], ["benchmarks", "▥ Bars"], ["radar", "◎ Radar"], ["scatter", "◌ Price×Quality"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200 border font-mono tracking-wide
                  ${view === v
                    ? "bg-rose-accent border-rose-accent text-white"
                    : "bg-transparent border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary"
                  }`}
              >
                {l}
              </button>
            ))}
            <ThemeToggle />
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap pb-3.5">
          <button
            onClick={() => setPanelOpen(true)}
            className="px-3.5 py-1.5 rounded-[20px] text-[12px] font-semibold cursor-pointer border-2 border-dashed border-rose-accent bg-rose-accent/[0.06] text-rose-accent font-mono inline-flex items-center gap-1.5 transition-all duration-200 hover:bg-rose-accent/[0.12]"
          >
            <span className="text-[16px] leading-none">+</span> Select Models
            {selected.length > 0 && (
              <span className="min-w-[20px] h-5 rounded-full bg-rose-accent text-white text-[10px] font-bold inline-flex items-center justify-center px-1">
                {selected.length}
              </span>
            )}
          </button>

          {selectedModels.map((m, i) => (
            <div
              key={m.id}
              className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-[20px] text-[12px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap font-mono animate-fade-in"
              style={{
                border: `1px solid ${MODEL_COLORS[i % MODEL_COLORS.length]}40`,
                borderLeft: `3px solid ${m.providerColor}`,
                background: `${MODEL_COLORS[i % MODEL_COLORS.length]}10`,
                color: MODEL_COLORS[i % MODEL_COLORS.length],
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ background: m.providerColor }} />
              <span>{m.name}</span>
              <span
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] cursor-pointer transition-all duration-150 hover:!bg-rose-accent hover:!text-white"
                style={{
                  background: `${MODEL_COLORS[i % MODEL_COLORS.length]}25`,
                  color: MODEL_COLORS[i % MODEL_COLORS.length],
                }}
                onClick={() => toggleModel(m.id)}
              >
                ✕
              </span>
            </div>
          ))}
          {selected.length > 0 && (
            <button
              className="bg-transparent text-text-dim text-[11px] border-none cursor-pointer font-mono"
              onClick={() => setSelected([])}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Provider Filter Bar */}
        {selected.length > 0 && activeProviders.length > 1 && (
          <div className="flex gap-1.5 items-center flex-wrap pb-3 -mt-1">
            <span className="text-[10px] text-text-dim uppercase tracking-[1px] font-semibold mr-1">Provider</span>
            <button
              onClick={() => setHeaderProviderFilter(null)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono
                ${!headerProviderFilter
                  ? "border-rose-accent text-rose-accent bg-rose-accent/[0.08]"
                  : "border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary"
                }`}
            >
              All
            </button>
            {activeProviders.map(p => (
              <button
                key={p.name}
                onClick={() => setHeaderProviderFilter(headerProviderFilter === p.name ? null : p.name)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono inline-flex items-center gap-1.5
                  ${headerProviderFilter === p.name
                    ? "border-rose-accent text-rose-accent bg-rose-accent/[0.08]"
                    : "border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary"
                  }`}
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SIDE PANEL OVERLAY */}
      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* SIDE PANEL */}
      {panelOpen && (
        <div className="fixed top-0 left-0 bottom-0 w-[400px] max-w-[90vw] bg-surface-card-alt border-r border-border-default z-[100] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-slide-in">
          {/* Panel Header */}
          <div className="px-[18px] py-4 border-b border-border-light shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-[16px] font-bold flex items-center gap-2">
                Select Models
                {selected.length > 0 && (
                  <span className="min-w-[20px] h-5 rounded-full bg-rose-accent text-white text-[10px] font-bold inline-flex items-center justify-center px-1">
                    {selected.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="bg-border-default border-none text-text-secondary w-7 h-7 rounded-md cursor-pointer text-[14px] flex items-center justify-center font-mono"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="bg-surface-card border border-border-default rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
              <span className="text-text-dim text-[14px]">🔍</span>
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search models or providers..."
                className="w-full bg-transparent border-none outline-none text-text-primary text-[13px] font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-transparent border-none text-text-dim cursor-pointer text-[12px] font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Provider Filters */}
            <div className="flex gap-1 flex-wrap mb-2">
              <button
                onClick={() => setProviderFilter(null)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono
                  ${!providerFilter
                    ? "border-rose-accent text-rose-accent bg-rose-accent/[0.08]"
                    : "border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary"
                  }`}
              >
                All
              </button>
              {PROVIDERS.map(p => (
                <button
                  key={p}
                  onClick={() => setProviderFilter(providerFilter === p ? null : p)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono
                    ${providerFilter === p
                      ? "border-rose-accent text-rose-accent bg-rose-accent/[0.08]"
                      : "border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Tier Filters */}
            <div className="flex gap-1 flex-wrap">
              {Object.entries(TIERS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setTierFilter(tierFilter === k ? null : k)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono
                    ${tierFilter === k
                      ? "border-rose-accent text-rose-accent bg-rose-accent/[0.08]"
                      : "border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary"
                    }`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Compare Presets */}
          <div className="px-[18px] py-2.5 border-b border-border-light shrink-0">
            <div className="text-[9px] text-text-dim uppercase tracking-[1.5px] mb-2 font-semibold">
              Quick Compare
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(p.ids)}
                  className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border border-border-default bg-surface-card-alt text-text-secondary transition-all duration-150 font-mono whitespace-nowrap hover:border-rose-accent hover:text-rose-accent hover:bg-rose-accent/[0.05]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model List — grouped by provider */}
          <div className="flex-1 overflow-auto py-1.5">
            {groupedFilteredModels.map(group => (
              <div key={group.provider}>
                <div className="sticky top-0 z-[1] px-3.5 py-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[1px] text-text-muted bg-surface-card-alt border-b border-border-light">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: group.providerColor }} />
                  {group.provider}
                  <span className="text-text-dim font-normal">({group.models.length})</span>
                </div>
                {group.models.map(m => {
                  const isSelected = selected.includes(m.id);
                  const idx = selected.indexOf(m.id);
                  const color = isSelected ? MODEL_COLORS[idx % MODEL_COLORS.length] : undefined;
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className="py-2 px-3.5 cursor-pointer flex items-center gap-2.5 transition-colors duration-100 rounded-md mx-1.5 my-px hover:bg-[var(--hover-overlay)]"
                      style={{ background: isSelected ? `${color}08` : undefined }}
                    >
                      <Checkbox checked={isSelected} color={color} />
                      <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ background: m.providerColor }} />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[13px]"
                          style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? color : "var(--text-primary)" }}
                        >
                          {m.name}
                        </div>
                        <div className="text-[10px] text-text-dim flex gap-2">
                          <span>{m.provider}</span><span>·</span>
                          <span>{fmt(m.context)} ctx</span><span>·</span>
                          <span>{fmtPrice(m.input)} / {fmtPrice(m.output)}</span>
                        </div>
                      </div>
                      <span
                        className="text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-[10px] font-semibold"
                        style={{
                          background: `${TIERS[m.tier].color}18`,
                          color: TIERS[m.tier].color,
                        }}
                      >
                        {TIERS[m.tier].label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            {filteredModels.length === 0 && (
              <div className="p-[30px] text-center text-text-dim text-[12px]">No models match your search</div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-[18px] py-3 border-t border-border-light shrink-0 flex items-center justify-between">
            <button
              onClick={() => setSelected(MODELS.map(m => m.id))}
              className="bg-transparent border-none text-text-muted cursor-pointer text-[11px] font-mono"
            >
              Select all ({MODELS.length})
            </button>
            <button
              onClick={() => setPanelOpen(false)}
              className="px-5 py-2 rounded-lg text-[12px] font-semibold cursor-pointer border-none bg-rose-accent text-white font-mono"
            >
              Compare {selected.length} model{selected.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {selected.length === 0 && (
          <div className="text-center py-20 text-text-dim">
            <div className="text-[48px] mb-4">⬡</div>
            <div className="font-display text-[18px] font-semibold mb-2 text-text-muted">
              No models selected
            </div>
            <div className="text-[13px] mb-5">Click "Select Models" or pick a preset below</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(p.ids)}
                  className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border border-border-default bg-surface-card-alt text-text-secondary transition-all duration-150 font-mono whitespace-nowrap hover:border-rose-accent hover:text-rose-accent hover:bg-rose-accent/[0.05]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TABLE VIEW */}
        {selected.length > 0 && view === "table" && (
          <div className="bg-surface-card border border-border-default rounded-xl overflow-x-auto animate-fade-in">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted select-none whitespace-nowrap sticky left-0 bg-surface-card z-[2] min-w-[140px]">
                    Provider
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted select-none whitespace-nowrap min-w-[140px]">
                    Model
                  </th>
                  {[
                    ["context", "Context"],
                    ["input", "Input $/M"],
                    ["output", "Output $/M"],
                    ["speed", "Speed"],
                    ["latency", "TTFT"],
                    ["quality", "Quality"],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                    >
                      {label} <SortIcon field={key} />
                    </th>
                  ))}
                  {BENCHMARKS.map(b => (
                    <th
                      key={b}
                      onClick={() => handleSort(b)}
                      className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                    >
                      {BENCH_LABELS[b]} <SortIcon field={b} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayModels.map((m) => {
                  const colorIdx = selected.indexOf(m.id);
                  return (
                    <tr key={m.id} className="border-b border-border-light transition-colors duration-100 hover:bg-[var(--hover-overlay)]">
                      <td className="px-3 py-2.5 text-left whitespace-nowrap sticky left-0 bg-surface-card z-[1]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full shrink-0 inline-flex items-center justify-center text-[10px] font-bold text-white" style={{ background: m.providerColor }}>
                            {m.provider.charAt(0)}
                          </span>
                          <span className="text-[13px] font-semibold">{m.provider}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-left text-[13px] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-[3px] h-5 rounded-sm" style={{ background: MODEL_COLORS[colorIdx % MODEL_COLORS.length] }} />
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.context === bestValues.context ? "text-metric-best font-semibold" : ""}`}>
                        {fmt(m.context)}
                      </td>
                      <td className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.input === bestValues.input ? "text-metric-best font-semibold" : ""}`}>
                        {fmtPrice(m.input)}
                      </td>
                      <td className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.output === bestValues.output ? "text-metric-best font-semibold" : ""}`}>
                        {fmtPrice(m.output)}
                      </td>
                      <td className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.speed === bestValues.speed ? "text-metric-best font-semibold" : ""}`}>
                        {m.speed} t/s
                      </td>
                      <td className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.latency === bestValues.latency ? "text-metric-best font-semibold" : ""}`}>
                        {m.latency}s
                      </td>
                      <td className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap font-semibold ${m.quality === bestValues.quality ? "text-metric-best" : ""}`}>
                        {m.quality}
                      </td>
                      {BENCHMARKS.map(b => (
                        <td key={b} className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m[b] === bestValues[b] ? "text-metric-best font-semibold" : ""}`}>
                          {m[b] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* BAR CHART */}
        {selected.length > 0 && view === "benchmarks" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 animate-fade-in">
            <div className="font-display text-[15px] font-semibold mb-5">
              <span className="text-rose-accent">▥</span> Benchmark Comparison
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={benchmarkData} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="name" tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }} axisLine={{ stroke: chartColors.axis }} tickLine={false} />
                <YAxis tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }} axisLine={{ stroke: chartColors.axis }} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontFamily: "'JetBrains Mono'", fontSize: 12, color: chartColors.textPrimary }} />
                {displayModels.map((m) => {
                  const colorIdx = selected.indexOf(m.id);
                  return <Bar key={m.id} dataKey={m.id} name={m.name} fill={MODEL_COLORS[colorIdx % MODEL_COLORS.length]} radius={[3, 3, 0, 0]} />;
                })}
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-3 flex-wrap">
              {displayModels.map((m) => {
                const colorIdx = selected.indexOf(m.id);
                return (
                  <div key={m.id} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: MODEL_COLORS[colorIdx % MODEL_COLORS.length] }} />
                    {m.name}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RADAR */}
        {selected.length > 0 && view === "radar" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 animate-fade-in">
            <div className="font-display text-[15px] font-semibold mb-5">
              <span className="text-rose-accent">◎</span> Capability Radar
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis dataKey="benchmark" tick={{ fill: chartColors.textSecondary, fontSize: 11, fontFamily: "'JetBrains Mono'" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: chartColors.tickDim, fontSize: 9 }} axisLine={false} />
                {displayModels.map((m) => {
                  const colorIdx = selected.indexOf(m.id);
                  return <Radar key={m.id} name={m.name} dataKey={m.id} stroke={MODEL_COLORS[colorIdx % MODEL_COLORS.length]} fill={MODEL_COLORS[colorIdx % MODEL_COLORS.length]} fillOpacity={0.08} strokeWidth={2} />;
                })}
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: chartColors.textSecondary }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SCATTER */}
        {selected.length > 0 && view === "scatter" && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 animate-fade-in">
            <div className="font-display text-[15px] font-semibold mb-1">
              <span className="text-rose-accent">◌</span> Price vs Quality
            </div>
            <div className="text-[11px] text-text-dim mb-5">
              Blended price (3:1 input/output) · Bubble size = output speed
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" dataKey="x" name="Price" tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }} axisLine={{ stroke: chartColors.axis }} tickLine={false} label={{ value: "Blended Price ($/M tokens)", position: "bottom", offset: 4, style: { fill: chartColors.tickDim, fontSize: 10 } }} scale="log" domain={["auto", "auto"]} />
                <YAxis type="number" dataKey="y" name="Quality" tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }} axisLine={{ stroke: chartColors.axis }} tickLine={false} label={{ value: "Quality Index", angle: -90, position: "insideLeft", offset: 10, style: { fill: chartColors.tickDim, fontSize: 10 } }} />
                <ZAxis type="number" dataKey="z" range={[200, 800]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: chartColors.cursor }}
                  contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 8, fontFamily: "'JetBrains Mono'", fontSize: 12, color: chartColors.textPrimary }}
                  formatter={(val, name) => name === "Price" ? `$${val.toFixed(2)}/M` : name === "Quality" ? val.toFixed(1) : `${val} t/s`}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={0.7} stroke={d.color} strokeWidth={1.5} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2 flex-wrap">
              {scatterData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {displayModels.length > 1 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5 mt-4 animate-fade-in">
            {[
              { label: "Cheapest Input", value: displayModels.reduce((a, b) => a.input < b.input ? a : b), metric: m => fmtPrice(m.input) + "/M" },
              { label: "Cheapest Output", value: displayModels.reduce((a, b) => a.output < b.output ? a : b), metric: m => fmtPrice(m.output) + "/M" },
              { label: "Highest Quality", value: displayModels.reduce((a, b) => a.quality > b.quality ? a : b), metric: m => m.quality.toFixed(2) },
              { label: "Fastest Speed", value: displayModels.reduce((a, b) => a.speed > b.speed ? a : b), metric: m => m.speed + " tok/s" },
              { label: "Lowest Latency", value: displayModels.reduce((a, b) => a.latency < b.latency ? a : b), metric: m => m.latency + "s TTFT" },
              { label: "Best Coder", value: displayModels.reduce((a, b) => (a.coding ?? 0) > (b.coding ?? 0) ? a : b), metric: m => m.coding + " coding" },
            ].map(({ label, value: m, metric }) => (
              <div key={label} className="bg-surface-card-alt border border-border-light rounded-[10px] px-3.5 py-2.5" style={{ borderLeft: `3px solid ${m.providerColor}` }}>
                <div className="text-[9px] text-text-dim uppercase tracking-[1.5px] mb-1.5">{label}</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ background: m.providerColor }} />
                  <span className="text-[12px] font-semibold text-metric-best">{m.name}</span>
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{metric(m)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
