import type { BenchmarkKey, Preset, SortableField, TierInfo, TierKey } from '../types/model';
import MODELS from './models.json';

export const PRESETS: Preset[] = [
  { label: '🏆 Frontier Battle', ids: ['gpt5', 'opus46', 'gemini31pro', 'glm5'] },
  {
    label: '💰 Best Value',
    ids: ['kimik25', 'minimaxm25', 'doubao20pro', 'deepseekv3'],
  },
  {
    label: '⚡ Budget Kings',
    ids: ['gpt4omini', 'gemini25flash', 'gptoss20b', 'llama4scout', 'mistralsmall3'],
  },
  {
    label: '🧠 Coding Focus',
    ids: ['kimik25', 'minimaxm25', 'glm5', 'opus46', 'gptoss20b'],
  },
  {
    label: '🇨🇳 vs 🇺🇸',
    ids: ['glm5', 'kimik25', 'doubao20pro', 'gpt5', 'opus46', 'gemini31pro'],
  },
];

const _providerSet = new Set<string>();
const _providerColors: Record<string, string> = {};
for (const m of MODELS) {
  _providerSet.add(m.provider);
  _providerColors[m.provider] = m.providerColor;
}
export const PROVIDERS: string[] = [..._providerSet];
export const PROVIDER_COLORS: Record<string, string> = _providerColors;

export const TIERS: Record<TierKey, TierInfo> = {
  frontier: { label: 'Frontier', color: '#f59e0b', icon: '🏆' },
  mid: { label: 'Mid', color: '#6366f1', icon: '⚖️' },
  budget: { label: 'Budget', color: '#10b981', icon: '💰' },
};

export const BENCHMARKS: BenchmarkKey[] = ['coding', 'mmlu', 'gpqa', 'math', 'swe', 'aime'];

export const BENCH_LABELS: Record<BenchmarkKey, string> = {
  coding: 'Coding',
  mmlu: 'MMLU',
  gpqa: 'GPQA',
  math: 'MATH 500',
  swe: 'SWE-Bench',
  aime: 'AIME 2025',
};

export const THUMB_BENCHMARKS: BenchmarkKey[] = ['coding', 'mmlu', 'math'];

export const MODEL_COLORS: string[] = [
  '#f43f5e',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#e11d48',
  '#0ea5e9',
  '#a855f7',
  '#22c55e',
  '#d946ef',
  '#0891b2',
  '#ca8a04',
  '#dc2626',
  '#7c3aed',
  '#059669',
  '#db2777',
  '#2563eb',
  '#65a30d',
];

export const fmt = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
};

export const fmtPrice = (n: number | null): string =>
  n === null ? '—' : n < 0.01 ? '<$0.01' : '$' + n.toFixed(2);

export const DATA_SOURCES: Record<SortableField, string> = {
  context: 'OpenRouter',
  input: 'OpenRouter',
  output: 'OpenRouter',
  speed: 'Artificial Analysis',
  latency: 'Artificial Analysis',
  quality: 'Artificial Analysis Quality Index',
  coding: 'LiveCodeBench',
  mmlu: 'MMLU-Pro',
  gpqa: 'GPQA Diamond',
  math: 'MATH-500',
  swe: 'SWE-Bench Verified',
  aime: 'AIME 2025',
};

export const DEFAULT_SELECTED: string[] = ['gpt5', 'opus46', 'gemini31pro', 'sonnet46'];
