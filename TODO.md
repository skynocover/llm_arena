# LLM Arena - TODO

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Vite + React |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| Deploy | Cloudflare Pages |
| Data | OpenRouter API (public, free) |

## Project Structure

```
llm-arena/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   └── LLMCompare.jsx
│   └── data/
│       └── models.json
├── scripts/
│   └── update-prices.ts
├── index.html
├── vite.config.js
├── package.json
└── TODO.md
```

---

## Phase 1: Project Setup

- [ ] Init Vite + React project
- [ ] Install Tailwind v4 + Vite plugin
- [ ] Move `llm-compare.jsx` → `src/components/LLMCompare.jsx`
- [ ] Replace inline styles with Tailwind classes
- [ ] Extract hardcoded `MODELS` array → `src/data/models.json`
- [ ] Install deps (`react`, `recharts`)
- [ ] Verify dev server works
- [ ] Deploy to Cloudflare Pages

## Phase 2: OpenRouter Update Script

Single script: `scripts/update-prices.ts`

- [ ] Fetch `https://openrouter.ai/api/v1/models`
- [ ] Match models by `openrouterId` field in `models.json`
- [ ] Update `pricing`, `context_length`, `max_output` only
- [ ] Print diff summary to stdout
- [ ] Write updated `models.json`
- [ ] Run manually: `npx tsx scripts/update-prices.ts`

## Phase 3: UI Polish

- [ ] Mobile responsive layout
- [ ] URL state sync (`?models=gpt5,opus46&view=radar`)
- [ ] Cost calculator (input token count → estimated cost per model)
- [ ] Dark/light mode toggle

## Phase 4: Future (Nice to Have)

- [ ] GitHub Actions to auto-run update script weekly
- [ ] More data sources (Artificial Analysis, Chatbot Arena)
- [ ] Historical price/benchmark trends
- [ ] Export comparison as PNG/CSV

## Phase 5: Deleted Ideas (Reference)

以下是簡化時移除的項目，未來有需要可以撿回來：

### 多來源資料管線
- Artificial Analysis API — benchmark 分數、intelligence_index、速度、TTFT 延遲
- Chatbot Arena (LMSYS) — ELO 評分、信心區間、投票數
- 多來源合併腳本 (`merge.ts`) — 三個 API 合併成一份 models.json
- Model ID 映射表 — 不同來源 ID 對照（最脆弱的部分）
- 資料驗證 — 價格 > 0、benchmark 0-100、模型不遺失檢查

### Snapshot 與歷史趨勢
- Snapshot 系統 — 每次更新存 `snapshots/YYYY-MM-DD.json`
- `TrendChart.jsx` — 價格/品質/速度隨時間的折線圖
- 價格變動指標 — 表格內顯示 ↓12% since last month
- 新增 "Trend" view tab

### 其他
- SEO — meta tags、og:image 動態圖表預覽
- 資料新鮮度指標 — footer 顯示 "Last updated: YYYY-MM-DD"
- 補充資料來源 — pricepertoken.com、HuggingFace Open LLM Leaderboard、SWE-bench、EvalPlus
