import type { BenchmarkKey, Preset, TierInfo, TierKey } from '../types/model';
import MODELS from './models.json';

export const PRESETS: Preset[] = [
  { label: '🏆 Frontier Battle', ids: ['gpt5', 'opus46', 'gemini31pro'] },
  { label: '💰 Best Value', ids: ['sonnet46', 'deepseekr1', 'qwen3235b', 'gpt41'] },
  {
    label: '⚡ Budget Kings',
    ids: ['gpt4omini', 'gemini25flash', 'haiku45', 'gptoss20b', 'llama4scout'],
  },
  { label: '🧠 Coding Focus', ids: ['opus46', 'gpt5', 'deepseekr1', 'gemini31pro', 'sonnet46'] },
  { label: '🇨🇳 vs 🇺🇸', ids: ['deepseekr1', 'qwen3235b', 'gpt5', 'sonnet46'] },
];

export const PROVIDERS: string[] = [...new Set(MODELS.map((m) => m.provider))];

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
  aime: 'AIME 2024',
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
];

export const fmt = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
};

export const fmtPrice = (n: number | null): string =>
  n === null ? '—' : n < 0.01 ? '<$0.01' : '$' + n.toFixed(2);

export const DEFAULT_SELECTED: string[] = ['gpt5', 'opus46', 'gemini31pro', 'sonnet46'];
