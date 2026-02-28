import { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Check, ChevronDown, Sun, Moon, X, Search } from 'lucide-react';
import MODELS from '../data/models.json';
import { useTheme } from '../context/useTheme.js';
import {
  PRESETS,
  PROVIDERS,
  TIERS,
  BENCHMARKS,
  BENCH_LABELS,
  THUMB_BENCHMARKS,
  MODEL_COLORS,
  DEFAULT_SELECTED,
  fmt,
  fmtPrice,
} from '../data/constants.js';

const Checkbox = ({ checked, color }) => (
  <div
    className="w-4.5 h-4.5 rounded-sm flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150"
    style={{
      border: `2px solid ${checked ? color || '#f43f5e' : 'var(--checkbox-border)'}`,
      background: checked ? color || '#f43f5e' : 'transparent',
    }}
  >
    {checked && <Check size={11} strokeWidth={2.5} className="text-white" />}
  </div>
);

const ChevronIcon = ({ collapsed }) => (
  <ChevronDown
    size={14}
    className={`transition-transform duration-200 text-text-muted ${collapsed ? '-rotate-90' : ''}`}
  />
);

const ASC_FIELDS_TABLE = new Set(['input', 'output', 'latency']);
const ASC_FIELDS_POOL = new Set(['input', 'output']);

const ThemeToggle = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 border border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary bg-transparent ml-2"
    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
  </button>
);

export default function LLMCompare() {
  const { theme, toggleTheme, chartColors } = useTheme();
  const tooltipStyle = {
    background: chartColors.tooltipBg,
    border: `1px solid ${chartColors.tooltipBorder}`,
    borderRadius: 8,
    fontFamily: "'JetBrains Mono'",
    fontSize: 12,
    color: chartColors.textPrimary,
  };
  const [selected, setSelected] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const modelsParam = params.get('models');
    if (modelsParam) {
      const validIds = new Set(MODELS.map((m) => m.id));
      const ids = modelsParam.split(',').filter((id) => validIds.has(id));
      return ids.length > 0 ? ids : DEFAULT_SELECTED;
    }
    return DEFAULT_SELECTED;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState(null);
  const [tierFilter, setTierFilter] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [expandedChart, setExpandedChart] = useState(null);

  const [poolCollapsed, setPoolCollapsed] = useState(false);
  const [poolSortBy, setPoolSortBy] = useState(null);
  const [poolSortDir, setPoolSortDir] = useState('asc');

  useEffect(() => {
    const url = new URL(window.location);
    if (selected.length === 0) {
      url.searchParams.delete('models');
    } else {
      url.searchParams.set('models', selected.join(','));
    }
    window.history.replaceState(null, '', url);
  }, [selected]);

  const toggleModel = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleChart = (chart) => setExpandedChart((prev) => (prev === chart ? null : chart));

  const getModelColor = (id) => MODEL_COLORS[selected.indexOf(id) % MODEL_COLORS.length];

  const selectedModels = useMemo(() => {
    let models = MODELS.filter((m) => selected.includes(m.id));
    if (sortBy) {
      models.sort((a, b) => {
        const va = a[sortBy] ?? -Infinity;
        const vb = b[sortBy] ?? -Infinity;
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    }
    return models;
  }, [selected, sortBy, sortDir]);

  const poolModels = useMemo(() => {
    let list = MODELS;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q),
      );
    }
    if (providerFilter) list = list.filter((m) => m.provider === providerFilter);
    if (tierFilter) list = list.filter((m) => m.tier === tierFilter);
    if (poolSortBy) {
      list = [...list].sort((a, b) => {
        const va = a[poolSortBy] ?? -Infinity;
        const vb = b[poolSortBy] ?? -Infinity;
        return poolSortDir === 'asc' ? va - vb : vb - va;
      });
    }
    return list;
  }, [searchQuery, providerFilter, tierFilter, poolSortBy, poolSortDir]);

  const makeSortHandler = (currentKey, setKey, setDir, ascFields) => (key) => {
    if (currentKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setKey(key);
      setDir(ascFields.has(key) ? 'asc' : 'desc');
    }
  };

  const handleSort = makeSortHandler(sortBy, setSortBy, setSortDir, ASC_FIELDS_TABLE);
  const handlePoolSort = makeSortHandler(
    poolSortBy,
    setPoolSortBy,
    setPoolSortDir,
    ASC_FIELDS_POOL,
  );

  const bestValues = useMemo(() => {
    const fields = [
      ['input', 'min'],
      ['output', 'min'],
      ['context', 'max'],
      ['speed', 'max'],
      ['latency', 'min'],
      ['quality', 'max'],
      ...BENCHMARKS.map((b) => [b, 'max']),
    ];
    const result = {};
    fields.forEach(([field, mode]) => {
      const vals = selectedModels.map((x) => x[field]).filter((x) => x != null);
      result[field] = vals.length ? (mode === 'max' ? Math.max(...vals) : Math.min(...vals)) : null;
    });
    return result;
  }, [selectedModels]);

  const benchmarkData = useMemo(
    () =>
      BENCHMARKS.map((b) => {
        const entry = { name: BENCH_LABELS[b], key: b };
        selectedModels.forEach((m) => {
          entry[m.id] = m[b];
        });
        return entry;
      }),
    [selectedModels],
  );

  const thumbBenchmarkData = useMemo(
    () => benchmarkData.filter((d) => THUMB_BENCHMARKS.includes(d.key)),
    [benchmarkData],
  );

  const scatterData = useMemo(
    () =>
      selectedModels.map((m) => ({
        name: m.name,
        x: (m.input * 3 + m.output) / 4,
        y: m.quality,
        z: m.speed,
        color: MODEL_COLORS[selected.indexOf(m.id) % MODEL_COLORS.length],
        provider: m.provider,
      })),
    [selectedModels, selected],
  );

  const makeSortIcon = (currentKey, currentDir) => (field) => {
    if (currentKey !== field) return <span className="opacity-30 text-[10px]">⇅</span>;
    return <span className="text-[10px] text-rose-accent">{currentDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const sortIcon = makeSortIcon(sortBy, sortDir);
  const poolSortIcon = makeSortIcon(poolSortBy, poolSortDir);

  const modelLegend = (
    <div className="flex gap-3 justify-center flex-wrap mt-2">
      {selectedModels.map((m) => (
        <div key={m.id} className="flex items-center gap-1.5 text-[10px] text-text-secondary">
          <div className="w-2 h-2 rounded-sm" style={{ background: getModelColor(m.id) }} />
          {m.name}
        </div>
      ))}
    </div>
  );

  return (
    <div className="font-mono bg-surface-bg text-text-primary min-h-screen flex flex-col">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-border-light shrink-0">
        <div className="flex items-center justify-between">
          <div className="font-display text-[20px] font-bold tracking-[-0.5px] flex items-center gap-2">
            <span className="text-rose-accent">⬡</span> LLM Arena
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {/* Empty state */}
        {selected.length === 0 && (
          <div className="text-center py-12 text-text-dim mb-4">
            <div className="text-[48px] mb-4">⬡</div>
            <div className="font-display text-[18px] font-semibold mb-2 text-text-muted">
              No models selected
            </div>
            <div className="text-[13px] mb-5">Pick a preset or add models from the pool below</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(p.ids)}
                  className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border border-border-default bg-surface-card-alt text-text-secondary transition-all duration-150 font-mono whitespace-nowrap hover:border-rose-accent hover:text-rose-accent hover:bg-rose-accent/5"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* COMPARISON CARD — header + table */}
        {selected.length > 0 && (
          <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden animate-fade-in mb-4">
            {/* Card header */}
            <div className="sticky top-0 z-10 bg-surface-card px-4 py-3 border-b border-border-default">
              <div className="flex items-center justify-between">
                <div className="font-display text-[14px] font-semibold flex items-center gap-2">
                  <span className="text-rose-accent">⬡</span>
                  Compare {selected.length} model{selected.length !== 1 ? 's' : ''}
                  <button
                    onClick={() => setSelected([])}
                    className="text-[11px] text-text-dim hover:text-rose-accent transition-colors duration-150 font-mono bg-transparent border-none cursor-pointer ml-1"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex gap-1.5 items-center flex-wrap">
                  <span className="text-[9px] text-text-dim uppercase tracking-[1.5px] font-semibold mr-1">
                    Presets
                  </span>
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(p.ids)}
                      className="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer border border-border-default bg-transparent text-text-secondary transition-all duration-150 font-mono whitespace-nowrap hover:border-rose-accent hover:text-rose-accent hover:bg-rose-accent/5"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="w-8 px-2 py-2.5"></th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted select-none whitespace-nowrap sticky left-0 bg-surface-card z-2 min-w-35">
                      Provider
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted select-none whitespace-nowrap min-w-35">
                      Model
                    </th>
                    {[
                      ['context', 'Context'],
                      ['input', 'Input $/M'],
                      ['output', 'Output $/M'],
                      ['speed', 'Speed'],
                      ['latency', 'TTFT'],
                      ['quality', 'Quality'],
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                      >
                        {label} {sortIcon(key)}
                      </th>
                    ))}
                    {BENCHMARKS.map((b) => (
                      <th
                        key={b}
                        onClick={() => handleSort(b)}
                        className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                      >
                        {BENCH_LABELS[b]} {sortIcon(b)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedModels.map((m) => (
                    <tr
                      key={m.id}
                      className="group border-b border-border-light transition-colors duration-100 hover:bg-(--hover-overlay)"
                    >
                      <td className="px-2 py-2.5 text-center">
                        <button
                          onClick={() => toggleModel(m.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-text-dim hover:text-rose-accent hover:bg-rose-accent/10 transition-colors duration-150 cursor-pointer bg-transparent border-none"
                        >
                          <X size={14} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-left whitespace-nowrap sticky left-0 bg-surface-card z-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full shrink-0 inline-flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: m.providerColor }}
                          >
                            {m.provider.charAt(0)}
                          </span>
                          <span className="text-[13px] font-semibold">{m.provider}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-left text-[13px] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-0.75 h-5 rounded-sm"
                            style={{ background: getModelColor(m.id) }}
                          />
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.context === bestValues.context ? 'text-metric-best font-semibold' : ''}`}
                      >
                        {fmt(m.context)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.input === bestValues.input ? 'text-metric-best font-semibold' : ''}`}
                      >
                        {fmtPrice(m.input)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.output === bestValues.output ? 'text-metric-best font-semibold' : ''}`}
                      >
                        {fmtPrice(m.output)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.speed === bestValues.speed ? 'text-metric-best font-semibold' : ''}`}
                      >
                        {m.speed} t/s
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m.latency === bestValues.latency ? 'text-metric-best font-semibold' : ''}`}
                      >
                        {m.latency}s
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap font-semibold ${m.quality === bestValues.quality ? 'text-metric-best' : ''}`}
                      >
                        {m.quality}
                      </td>
                      {BENCHMARKS.map((b) => (
                        <td
                          key={b}
                          className={`px-3 py-2.5 text-right text-[13px] whitespace-nowrap ${m[b] === bestValues[b] ? 'text-metric-best font-semibold' : ''}`}
                        >
                          {m[b] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHART THUMBNAILS */}
        {selected.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Bar thumbnail */}
            <div
              onClick={() => toggleChart('benchmarks')}
              className={`bg-surface-card border rounded-xl p-3 cursor-pointer transition-all duration-200 hover:border-rose-accent/50
                ${expandedChart === 'benchmarks' ? 'border-rose-accent shadow-[0_0_0_1px_var(--color-rose-accent)]' : 'border-border-default'}`}
            >
              <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5">
                <span className="text-rose-accent">▥</span> Benchmarks
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={thumbBenchmarkData} barCategoryGap="20%">
                  <XAxis
                    dataKey="name"
                    tick={{ fill: chartColors.tick, fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, 100]} />
                  {selectedModels.map((m) => (
                    <Bar
                      key={m.id}
                      dataKey={m.id}
                      fill={getModelColor(m.id)}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar thumbnail */}
            <div
              onClick={() => toggleChart('radar')}
              className={`bg-surface-card border rounded-xl p-3 cursor-pointer transition-all duration-200 hover:border-rose-accent/50
                ${expandedChart === 'radar' ? 'border-rose-accent shadow-[0_0_0_1px_var(--color-rose-accent)]' : 'border-border-default'}`}
            >
              <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5">
                <span className="text-rose-accent">◎</span> Capability Radar
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={benchmarkData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke={chartColors.grid} gridType="polygon" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fill: chartColors.tick, fontSize: 9 }}
                    tickLine={false}
                  />
                  <PolarRadiusAxis hide domain={[0, 100]} tick={false} axisLine={false} />
                  {selectedModels.map((m) => (
                    <Radar
                      key={m.id}
                      dataKey={m.id}
                      stroke={getModelColor(m.id)}
                      fill={getModelColor(m.id)}
                      fillOpacity={0.1}
                      strokeWidth={1.5}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Scatter thumbnail */}
            <div
              onClick={() => toggleChart('scatter')}
              className={`bg-surface-card border rounded-xl p-3 cursor-pointer transition-all duration-200 hover:border-rose-accent/50
                ${expandedChart === 'scatter' ? 'border-rose-accent shadow-[0_0_0_1px_var(--color-rose-accent)]' : 'border-border-default'}`}
            >
              <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5">
                <span className="text-rose-accent">◌</span> Price vs Quality
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    tick={{ fill: chartColors.tick, fontSize: 10 }}
                    axisLine={{ stroke: chartColors.grid }}
                    tickLine={false}
                    scale="log"
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    tick={{ fill: chartColors.tick, fontSize: 10 }}
                    axisLine={{ stroke: chartColors.grid }}
                    tickLine={false}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <ZAxis type="number" dataKey="z" range={[80, 300]} />
                  <Scatter data={scatterData}>
                    {scatterData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.color}
                        fillOpacity={0.7}
                        stroke={d.color}
                        strokeWidth={1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* EXPANDED CHART */}
        {selected.length > 0 && expandedChart === 'benchmarks' && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 animate-fade-in mb-4">
            <div className="flex items-center justify-between mb-5">
              <div className="font-display text-[15px] font-semibold">
                <span className="text-rose-accent">▥</span> Benchmark Comparison
              </div>
              <button
                onClick={() => setExpandedChart(null)}
                className="flex items-center gap-1 text-[11px] text-text-dim hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none font-mono"
              >
                <X size={12} /> Close
              </button>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={benchmarkData} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                  axisLine={{ stroke: chartColors.axis }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                  axisLine={{ stroke: chartColors.axis }}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip contentStyle={tooltipStyle} />
                {selectedModels.map((m) => (
                  <Bar
                    key={m.id}
                    dataKey={m.id}
                    name={m.name}
                    fill={getModelColor(m.id)}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {modelLegend}
          </div>
        )}

        {selected.length > 0 && expandedChart === 'radar' && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 animate-fade-in mb-4">
            <div className="flex items-center justify-between mb-5">
              <div className="font-display text-[15px] font-semibold">
                <span className="text-rose-accent">◎</span> Capability Radar
              </div>
              <button
                onClick={() => setExpandedChart(null)}
                className="flex items-center gap-1 text-[11px] text-text-dim hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none font-mono"
              >
                <X size={12} /> Close
              </button>
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <RadarChart data={benchmarkData}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{
                    fill: chartColors.textSecondary,
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono'",
                  }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: chartColors.tickDim, fontSize: 9 }}
                  axisLine={false}
                />
                {selectedModels.map((m) => (
                  <Radar
                    key={m.id}
                    name={m.name}
                    dataKey={m.id}
                    stroke={getModelColor(m.id)}
                    fill={getModelColor(m.id)}
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                ))}
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono'",
                    color: chartColors.textSecondary,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {selected.length > 0 && expandedChart === 'scatter' && (
          <div className="bg-surface-card border border-border-default rounded-xl p-6 animate-fade-in mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="font-display text-[15px] font-semibold">
                <span className="text-rose-accent">◌</span> Price vs Quality
              </div>
              <button
                onClick={() => setExpandedChart(null)}
                className="flex items-center gap-1 text-[11px] text-text-dim hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none font-mono"
              >
                <X size={12} /> Close
              </button>
            </div>
            <div className="text-[11px] text-text-dim mb-5">
              Blended price (3:1 input/output) · Bubble size = output speed
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Price"
                  tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                  axisLine={{ stroke: chartColors.axis }}
                  tickLine={false}
                  label={{
                    value: 'Blended Price ($/M tokens)',
                    position: 'bottom',
                    offset: 4,
                    style: { fill: chartColors.tickDim, fontSize: 10 },
                  }}
                  scale="log"
                  domain={['auto', 'auto']}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Quality"
                  tick={{ fill: chartColors.tick, fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                  axisLine={{ stroke: chartColors.axis }}
                  tickLine={false}
                  label={{
                    value: 'Quality Index',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: { fill: chartColors.tickDim, fontSize: 10 },
                  }}
                />
                <ZAxis type="number" dataKey="z" range={[200, 800]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: chartColors.cursor }}
                  contentStyle={tooltipStyle}
                  formatter={(val, name) =>
                    name === 'Price'
                      ? `$${val.toFixed(2)}/M`
                      : name === 'Quality'
                        ? val.toFixed(1)
                        : `${val} t/s`
                  }
                />
                <Scatter data={scatterData}>
                  {scatterData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.color}
                      fillOpacity={0.7}
                      stroke={d.color}
                      strokeWidth={1.5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {modelLegend}
          </div>
        )}

        {/* MODEL POOL */}
        <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden animate-fade-in">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-(--hover-overlay) transition-colors duration-100"
            onClick={() => setPoolCollapsed(!poolCollapsed)}
          >
            <div className="flex items-center gap-2">
              <ChevronIcon collapsed={poolCollapsed} />
              <span className="font-display text-[14px] font-semibold">Model Pool</span>
              <span className="text-[12px] text-text-muted">({MODELS.length} models)</span>
            </div>
            {selected.length > 0 && (
              <span className="text-[11px] text-text-dim font-mono">
                {selected.length} selected
              </span>
            )}
          </div>
          {!poolCollapsed && (
            <>
              <div className="px-4 pb-3 border-t border-border-light pt-3">
                <div className="bg-surface-card-alt border border-border-default rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
                  <Search size={14} className="text-text-dim" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search models or providers..."
                    className="w-full bg-transparent border-none outline-none text-text-primary text-[13px] font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-transparent border-none text-text-dim cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex gap-1 flex-wrap items-center mb-3">
                  <button
                    onClick={() => setProviderFilter(null)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono
                      ${
                        !providerFilter
                          ? 'border-rose-accent text-rose-accent bg-rose-accent/8'
                          : 'border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary'
                      }`}
                  >
                    All
                  </button>
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setProviderFilter(providerFilter === p ? null : p)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono
                        ${
                          providerFilter === p
                            ? 'border-rose-accent text-rose-accent bg-rose-accent/8'
                            : 'border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                  <span className="w-px h-4 bg-border-default mx-1" />
                  {Object.entries(TIERS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setTierFilter(tierFilter === k ? null : k)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-medium cursor-pointer transition-all duration-150 border font-mono
                        ${
                          tierFilter === k
                            ? 'border-rose-accent text-rose-accent bg-rose-accent/8'
                            : 'border-border-default text-text-muted bg-transparent hover:border-border-active hover:text-text-secondary'
                        }`}
                    >
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-100 overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-t border-border-default sticky top-0 bg-surface-card z-1">
                      <th className="w-10 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted whitespace-nowrap">
                        Provider
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted whitespace-nowrap">
                        Model
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted whitespace-nowrap">
                        Tier
                      </th>
                      <th
                        onClick={() => handlePoolSort('context')}
                        className="px-3 py-2 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                      >
                        Context {poolSortIcon('context')}
                      </th>
                      <th
                        onClick={() => handlePoolSort('input')}
                        className="px-3 py-2 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                      >
                        Input $/M {poolSortIcon('input')}
                      </th>
                      <th
                        onClick={() => handlePoolSort('output')}
                        className="px-3 py-2 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                      >
                        Output $/M {poolSortIcon('output')}
                      </th>
                      <th
                        onClick={() => handlePoolSort('quality')}
                        className="px-3 py-2 text-right text-[10px] font-semibold tracking-[1.5px] uppercase text-text-muted cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-text-primary"
                      >
                        Quality {poolSortIcon('quality')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolModels.map((m) => {
                      const colorIdx = selected.indexOf(m.id);
                      const isSelected = colorIdx !== -1;
                      const color = isSelected
                        ? MODEL_COLORS[colorIdx % MODEL_COLORS.length]
                        : undefined;
                      return (
                        <tr
                          key={m.id}
                          onClick={() => toggleModel(m.id)}
                          className="border-t border-border-light cursor-pointer transition-colors duration-100 hover:bg-(--hover-overlay)"
                          style={{ background: isSelected ? `${color}08` : undefined }}
                        >
                          <td className="px-3 py-2 text-center">
                            <Checkbox checked={isSelected} color={color} />
                          </td>
                          <td className="px-3 py-2 text-left whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
                                style={{ background: m.providerColor }}
                              />
                              <span className="text-[12px]">{m.provider}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-left whitespace-nowrap">
                            <span
                              className="text-[12px]"
                              style={{
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? color : 'var(--text-primary)',
                              }}
                            >
                              {m.name}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-left whitespace-nowrap">
                            <span
                              className="text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-[10px] font-semibold"
                              style={{
                                background: `${TIERS[m.tier].color}18`,
                                color: TIERS[m.tier].color,
                              }}
                            >
                              {TIERS[m.tier].label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] whitespace-nowrap">
                            {fmt(m.context)}
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] whitespace-nowrap">
                            {fmtPrice(m.input)}
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] whitespace-nowrap">
                            {fmtPrice(m.output)}
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] whitespace-nowrap">
                            {m.quality}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {poolModels.length === 0 && (
                  <div className="p-8 text-center text-text-dim text-[12px]">
                    No models match your filters
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
