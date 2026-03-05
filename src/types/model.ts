export interface Model {
  id: string;
  openrouterId: string;
  name: string;
  provider: string;
  providerColor: string;
  input: number | null;
  output: number | null;
  cached: number | null;
  context: number;
  maxOutput: number;
  speed: number | null;
  latency: number | null;
  coding: number | null;
  mmlu: number | null;
  gpqa: number | null;
  math: number | null;
  swe: number | null;
  aime: number | null;
  quality: number | null;
  tier: 'frontier' | 'mid' | 'budget';
  [key: string]: string | number | null;
}

export type BenchmarkKey = 'coding' | 'mmlu' | 'gpqa' | 'math' | 'swe' | 'aime';

export type SortableField =
  | 'context'
  | 'input'
  | 'output'
  | 'speed'
  | 'latency'
  | 'quality'
  | BenchmarkKey;

export type SortDir = 'asc' | 'desc';

export type TierKey = 'frontier' | 'mid' | 'budget';

export interface TierInfo {
  label: string;
  color: string;
  icon: string;
}

export interface Preset {
  label: string;
  ids: string[];
}

export interface ChartColors {
  grid: string;
  tick: string;
  tickDim: string;
  tooltipBg: string;
  tooltipBorder: string;
  axis: string;
  cursor: string;
  textPrimary: string;
  textSecondary: string;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  chartColors: ChartColors;
}
