# LLM Arena

## Project

LLM model comparison tool built with React + Vite + Tailwind CSS v4 + Recharts.

## Stack

- React 19 (Vite dev server, JSX)
- Tailwind CSS v4 (CSS-first config via `src/index.css` `@theme` block)
- Recharts for charts
- lucide-react for icons
- pnpm as package manager

## Critical Rules

### DO

- Use `lucide-react` for icons — never use inline SVG
- Use Tailwind spacing scale (`w-4.5`) instead of arbitrary values (`w-[18px]`)
- Use Tailwind opacity integers (`bg-rose-accent/8`) instead of arbitrary values (`bg-rose-accent/[0.08]`)
- Use arrow functions for all functions
- Use single quotes (`'`) not double quotes (`"`)
- Run `npx prettier --write` after writing code (config in `.prettierrc`)
- Keep component files under 300 lines — split if larger
- When refactoring, preserve the existing UI — reuse existing code instead of rewriting
- Close dev servers after testing to avoid port conflicts
- Start tasks with a todo list, check and update it as you work

### NEVER

- Do not modify dependency versions in `package.json`
- Do not write custom CSS — use Tailwind only
- Do not use inline SVG — use `lucide-react`

## Conventions

### Tailwind v4 Syntax

- Use `bg-(--custom-var)` instead of `bg-[var(--custom-var)]` for CSS variable references
- Use built-in scale values instead of arbitrary values when possible:
  - Spacing/sizing: `w-4.5` not `w-[18px]`, `w-0.75` not `w-[3px]`, `min-w-35` not `min-w-[140px]` (scale × 4 = px)
  - Z-index: `z-1`, `z-2` not `z-[1]`, `z-[2]`
  - Border radius: `rounded-sm` not `rounded-[4px]`
- These are Tailwind v4 shorthand forms — always prefer them

### React Fast Refresh

- Component files (`.jsx`) must **only export components** — no constants, utility functions, or data
- Extract shared constants and helpers to separate files (e.g., `src/data/constants.js`)
- Hooks go in their own files (e.g., `src/context/useTheme.js`)

### Component Definitions

- Never define components inside other components (causes "Cannot create components during render")
- Small reusable components: define at file top level, pass state via props
- One-off render helpers that depend on parent state: use plain functions (not components), e.g., `const sortIcon = (field) => <span>...</span>`

### File Structure

- `src/components/` — React components (only component exports)
- `src/data/` — JSON data and shared constants
- `src/context/` — React context providers + hooks (separate files)

### localStorage

- Theme key: `llm-arena-theme`
