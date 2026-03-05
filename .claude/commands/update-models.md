---
description: Search for, add, or update LLM model data (pricing, speed, latency, benchmarks) in models.json. Use when the user asks to look up new models, research model specs, add a model, or refresh existing data.
argument-hint: Model name or ID (e.g. "GPT-5", "opus46", "Gemini 3.1 Flash-Lite") or "all" to update everything
---

# Update / Add Models Data

You are updating or adding models in `src/data/models.json` with the latest pricing, performance, and benchmark data.

**Target:** $ARGUMENTS (if empty, ask the user which models to update/add or whether to update all)

---

## Step 0 — Understand the Schema

Read these files first:

- `src/types/model.ts` — the `Model` interface defines every field
- `src/data/models.json` — current model data
- `src/data/constants.ts` — presets and defaults that reference model IDs

Every model object must have these fields:

| Field           | Type             | Description                                               |
| --------------- | ---------------- | --------------------------------------------------------- |
| `id`            | string           | Short stable ID used in code (e.g. `gpt5`)                |
| `openrouterId`  | string           | OpenRouter API model ID (e.g. `openai/gpt-5`)             |
| `name`          | string           | Display name                                              |
| `provider`      | string           | Provider company name                                     |
| `providerColor` | string           | Hex color for the provider                                |
| `input`         | number \| null   | Input price per 1M tokens (USD), null if unknown          |
| `output`        | number \| null   | Output price per 1M tokens (USD), null if unknown         |
| `cached`        | number \| null   | Cached input price per 1M tokens, null if unavailable     |
| `context`       | number           | Context window size in tokens                             |
| `maxOutput`     | number           | Max output tokens                                         |
| `speed`         | number \| null   | Output speed in tokens/sec, null if unknown               |
| `latency`       | number \| null   | Time to first token in seconds, null if unknown           |
| `coding`        | number \| null   | HumanEval / LiveCodeBench score (0-100), null if unknown  |
| `mmlu`          | number \| null   | MMLU-Pro score (0-100), null if unknown                   |
| `gpqa`          | number \| null   | GPQA Diamond score (0-100), null if unknown               |
| `math`          | number \| null   | MATH-500 score (0-100), null if unknown                   |
| `swe`           | number \| null   | SWE-Bench Verified score (0-100), null if unknown         |
| `aime`          | number \| null   | AIME 2025 score (0-100), null if unknown                  |
| `quality`       | number \| null   | Artificial Analysis Quality Index, null if unknown        |
| `tier`          | string           | One of: `frontier`, `mid`, `budget`                       |

**CRITICAL: Only use confirmed, real data. Set fields to `null` when data is unavailable. NEVER estimate or guess values.**

The UI will display `N/A` for null fields automatically.

---

## Step 1 — Search Strategy (What Works and What Doesn't)

### Recommended approach order

1. **Start with WebSearch** for discovery — find which sources have the data you need
2. **Use WebFetch on working sources** to extract detailed numbers
3. **Fall back to the OpenRouter API** for structured pricing data

### Sources that WORK with WebFetch

| Source                     | URL pattern                                        | What you get                          |
| -------------------------- | -------------------------------------------------- | ------------------------------------- |
| Artificial Analysis        | `artificialanalysis.ai/models/{slug}`              | speed, latency, quality index, pricing |
| Google DeepMind model cards | `deepmind.google/models/model-cards/{model-name}/` | official benchmark scores             |
| OpenRouter API (JSON)      | `openrouter.ai/api/v1/models`                      | pricing, context, max output          |
| NxCode blog posts          | `nxcode.io/resources/news/{slug}`                  | model specs comparison                |

### Sources that FAIL with WebFetch (return 403 or block)

| Source                  | URL pattern                              | Use instead            |
| ----------------------- | ---------------------------------------- | ---------------------- |
| OpenAI official pages   | `openai.com/*`, `platform.openai.com/*`  | WebSearch only         |
| OpenAI pricing page     | `developers.openai.com/api/docs/pricing` | WebSearch only         |
| llm-stats.com           | `llm-stats.com/models/*`                 | Sometimes works, flaky |
| Anthropic docs          | `platform.claude.com/*`                  | WebSearch only         |

### Key lessons

- **WebSearch first, WebFetch second**: Use WebSearch to find data, then WebFetch only on sources known to work
- **Run WebSearch calls in parallel**: Search for pricing, benchmarks, and performance simultaneously
- **Very new models** (released within days) may not have benchmark data on aggregator sites yet — set those fields to `null`
- **Conflicting data between sources**: Prefer this priority order (see Step 3 for details)
- **Don't retry failed WebFetch**: If a source returns 403, move to the next source — don't retry the same URL

---

## Step 2 — Fetch Pricing from OpenRouter

Use WebFetch to call the OpenRouter API:

```
GET https://openrouter.ai/api/v1/models
```

Extract for each target model:

- `pricing.prompt` — input price (per token -> convert to per 1M tokens)
- `pricing.completion` — output price (per token -> convert to per 1M tokens)
- `context_length` — context window
- `top_provider.max_completion_tokens` — max output tokens

**Price conversion:** OpenRouter returns price per token as a string. Multiply by 1,000,000 to get price per 1M tokens.

If the model is not on OpenRouter yet, search for pricing on the provider's official page using WebSearch.

### OpenRouter ID Reference

**Frontier:**

| Model ID     | OpenRouter ID                   |
| ------------ | ------------------------------- |
| gpt5         | openai/gpt-5                    |
| opus46       | anthropic/claude-opus-4.6       |
| gemini31pro  | google/gemini-3.1-pro-preview   |
| grok4        | x-ai/grok-4                     |
| glm5         | z-ai/glm-5                      |
| kimik25      | moonshotai/kimi-k2.5            |
| minimaxm25   | minimax/minimax-m2.5            |
| doubao20pro  | bytedance/doubao-seed-2.0-pro   |
| o3           | openai/o3                       |
| gpt53codex   | openai/gpt-5.3-codex            |
| gemini25pro  | google/gemini-2.5-pro           |
| opus45       | anthropic/claude-opus-4.5       |
| deepseekv32s | deepseek/deepseek-v3.2-speciale |
| qwen35397b   | qwen/qwen3.5-397b-a17b          |
| qwen3max     | qwen/qwen3-max-thinking         |

**Mid:**

| Model ID        | OpenRouter ID                  |
| --------------- | ------------------------------ |
| sonnet46        | anthropic/claude-sonnet-4.6    |
| gpt41           | openai/gpt-4.1                 |
| deepseekv3      | deepseek/deepseek-v3.2         |
| deepseekr1      | deepseek/deepseek-r1           |
| qwen3235b       | qwen/qwen3-235b-a22b-instruct |
| mistrallarge3   | mistralai/mistral-large-2512   |
| llama4maverick  | meta-llama/llama-4-maverick    |
| gemini3flash    | google/gemini-3-flash-preview  |
| o4mini          | openai/o4-mini                 |
| gpt5mini        | openai/gpt-5-mini              |
| gpt41mini       | openai/gpt-4.1-mini            |
| grok41fast      | x-ai/grok-4.1-fast             |
| grokcode1       | x-ai/grok-code-fast-1          |
| sonnet45        | anthropic/claude-sonnet-4.5    |
| deepseekr10528  | deepseek/deepseek-r1-0528      |
| devstral2       | mistralai/devstral-2512        |
| kimik2think     | moonshotai/kimi-k2-thinking    |
| minimaxm1       | minimax/minimax-m1             |
| mistralmedium31 | mistralai/mistral-medium-3.1   |
| gpt53instant    | openai/gpt-5.3-chat-latest     |

**Budget:**

| Model ID          | OpenRouter ID                            |
| ----------------- | ---------------------------------------- |
| haiku45           | anthropic/claude-haiku-4.5               |
| gpt4omini         | openai/gpt-4o-mini                       |
| gptoss20b         | openai/gpt-oss-20b                       |
| gemini25flash     | google/gemini-2.5-flash                  |
| llama4scout       | meta-llama/llama-4-scout                 |
| phi4              | microsoft/phi-4                          |
| gemma327b         | google/gemma-3-27b-it                    |
| mistralsmall3     | mistralai/mistral-small-3.2-24b-instruct |
| gpt5nano          | openai/gpt-5-nano                        |
| gpt41nano         | openai/gpt-4.1-nano                      |
| gemini25flashlite | google/gemini-2.5-flash-lite             |
| gemini31flashlite | google/gemini-3.1-flash-lite-preview     |
| grok3mini         | x-ai/grok-3-mini                         |
| qwen35flash       | qwen/qwen3.5-flash-02-23                 |
| qwen3coder        | qwen/qwen3-coder-next                    |
| glm47flash        | z-ai/glm-4.7-flash                       |
| seed20mini        | bytedance-seed/seed-2.0-mini             |

---

## Step 3 — Fetch Performance Data from Artificial Analysis

For each target model, use WebFetch to scrape its Artificial Analysis page:

```
https://artificialanalysis.ai/models/{slug}
```

Extract:

- **Speed** (tokens/sec) — output throughput
- **Latency** (seconds) — time to first token (TTFT)
- **Quality Index** — the AA quality score

### Artificial Analysis Slug Reference

**Frontier:**

| Model ID     | AA Slug                |
| ------------ | ---------------------- |
| gpt5         | gpt-5                  |
| opus46       | claude-opus-4-6        |
| gemini31pro  | gemini-3-1-pro-preview |
| grok4        | grok-4                 |
| glm5         | glm-5                  |
| kimik25      | kimi-k2-5              |
| minimaxm25   | minimax-m2-5           |
| doubao20pro  | doubao-seed-2-0-pro    |
| o3           | o3                     |
| gpt53codex   | gpt-5-3-codex          |
| gemini25pro  | gemini-2-5-pro         |
| opus45       | claude-opus-4-5        |
| deepseekv32s | deepseek-v3-2-speciale |
| qwen35397b   | qwen3-5-397b           |
| qwen3max     | qwen3-max-thinking     |

**Mid:**

| Model ID        | AA Slug            |
| --------------- | ------------------ |
| sonnet46        | claude-sonnet-4-6  |
| gpt41           | gpt-4-1            |
| deepseekv3      | deepseek-v3        |
| deepseekr1      | deepseek-r1        |
| qwen3235b       | qwen3-235b         |
| mistrallarge3   | mistral-large-3    |
| llama4maverick  | llama-4-maverick   |
| gemini3flash    | gemini-3-flash     |
| o4mini          | o4-mini            |
| gpt5mini        | gpt-5-mini         |
| gpt41mini       | gpt-4-1-mini       |
| grok41fast      | grok-4-1-fast      |
| grokcode1       | grok-code-fast-1   |
| sonnet45        | claude-4-5-sonnet  |
| deepseekr10528  | deepseek-r1-0528   |
| devstral2       | devstral-2         |
| kimik2think     | kimi-k2-thinking   |
| minimaxm1       | minimax-m1-80k     |
| mistralmedium31 | mistral-medium-3-1 |

**Budget:**

| Model ID          | AA Slug                    |
| ----------------- | -------------------------- |
| haiku45           | claude-3-5-haiku           |
| gpt4omini         | gpt-4o-mini                |
| gptoss20b         | gpt-oss-20b                |
| gemini25flash     | gemini-2-5-flash           |
| llama4scout       | llama-4-scout              |
| phi4              | phi-4                      |
| gemma327b         | gemma-3-27b                |
| mistralsmall3     | mistral-small-3            |
| gpt5nano          | gpt-5-nano                 |
| gpt41nano         | gpt-4-1-nano               |
| gemini25flashlite | gemini-2-5-flash-lite      |
| gemini31flashlite | gemini-3-1-flash-lite-preview |
| grok3mini         | grok-3-mini-reasoning      |
| qwen35flash       | qwen3-5-flash              |
| qwen3coder        | qwen3-coder-next           |
| glm47flash        | glm-4-7-flash              |
| seed20mini        | seed-2-0-mini              |

If the AA page doesn't load or the slug is wrong, try searching:

```
https://artificialanalysis.ai/leaderboards/models
```

---

## Step 4 — Fetch Benchmark Scores

For each target model, search for the latest benchmark scores. Use WebSearch to find:

1. **HumanEval / LiveCodeBench** -> `coding` field
2. **MMLU-Pro** -> `mmlu` field
3. **GPQA Diamond** -> `gpqa` field
4. **MATH-500** -> `math` field
5. **SWE-Bench Verified** -> `swe` field
6. **AIME 2025** -> `aime` field

### Search strategies:

- Search `"{model name}" benchmark scores {current year}`
- Check the model's official announcement blog post
- Check `https://artificialanalysis.ai/leaderboards/models` for aggregated scores
- Check provider pages (e.g. OpenAI, Anthropic, Google blog posts)

### Data sources and reliability

| Source                            | URL                                                 | What it has                                    | Reliability |
| --------------------------------- | --------------------------------------------------- | ---------------------------------------------- | ----------- |
| **Google DeepMind model cards**   | `deepmind.google/models/model-cards/{model}/`       | official benchmarks from Google                | Best        |
| **HuggingFace model cards**       | `huggingface.co/{org}/{model}`                      | official benchmark tables from providers       | Best        |
| **Artificial Analysis**           | `artificialanalysis.ai/models/{slug}`               | speed, latency, quality index, some benchmarks | Great       |
| **Artificial Analysis Leaderboard** | `artificialanalysis.ai/leaderboards/models`       | cross-model comparison                         | Great       |
| **Official provider blogs**       | See provider-specific sources below                 | benchmark scores from announcements            | Great       |
| **Automatio.ai**                  | `automatio.ai/models/{slug}`                        | consolidated benchmark scores                  | Good        |
| **LLM Stats**                     | `llm-stats.com/models/{slug}`                       | benchmarks, pricing, context                   | Good (flaky WebFetch) |
| **OpenRouter API**                | `openrouter.ai/api/v1/models`                       | pricing, context, max output                   | Good        |
| **OpenRouter model page**         | `openrouter.ai/{provider}/{model}`                  | pricing, context, max output                   | Good        |
| **Vellum LLM Leaderboard**       | `vellum.ai/llm-leaderboard`                         | cross-model benchmark comparison               | Good        |
| **Tech blog posts** (NxCode, etc) | Various                                             | comparison data, approximate specs             | Fair        |

### Provider-specific sources:

| Provider      | Source                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------- |
| **OpenAI**    | Blog posts at `openai.com/index/` (403 on WebFetch — use WebSearch only)                  |
| **Anthropic** | Blog at `anthropic.com/news/` (may 403 — use WebSearch only)                              |
| **Google**    | Model cards at `deepmind.google/models/model-cards/` (works with WebFetch)                |
| **DeepSeek**  | HuggingFace cards at `huggingface.co/deepseek-ai/`, arXiv papers                          |
| **xAI**       | `docs.x.ai/developers/models`, blog at `x.ai/news/`                                       |
| **Qwen**      | HuggingFace cards at `huggingface.co/Qwen/`, blog at `qwenlm.github.io`                   |
| **Mistral**   | HuggingFace cards at `huggingface.co/mistralai/`, docs at `docs.mistral.ai`               |
| **Moonshot**  | HuggingFace cards at `huggingface.co/moonshotai/`                                         |
| **MiniMax**   | HuggingFace cards at `huggingface.co/MiniMaxAI/`                                          |
| **ByteDance** | Official page at `seed.bytedance.com/en/seed2`                                            |
| **Zhipu AI**  | HuggingFace cards at `huggingface.co/zai-org/`                                            |
| **Meta**      | HuggingFace cards at `huggingface.co/meta-llama/`                                         |
| **Microsoft** | HuggingFace cards at `huggingface.co/microsoft/`                                          |

### Data source priority (highest to lowest):

1. **Official provider model cards / docs** — most authoritative (Google DeepMind, HuggingFace)
2. **Artificial Analysis** — speed, latency, quality index, leaderboard data
3. **OpenRouter API** — pricing, context, max output (structured JSON data)
4. **Automatio.ai / LLM Stats** — consolidated third-party benchmark data
5. **Vellum Leaderboard** — cross-model benchmark comparison
6. **Tech blog posts** — use only for cross-referencing, not as sole source
7. **Set to `null`** — if no reliable source exists, do NOT estimate

---

## Step 5 — Compile and Update

1. Merge all gathered data into the model objects
2. **Set any field to `null` if no confirmed data was found — NEVER estimate**
3. Round prices to 2 decimal places
4. Round benchmark scores to 1 decimal place
5. Round speed to nearest integer
6. Round latency to 2 decimal places
7. Update `src/data/models.json` using the Edit tool
8. Preserve the existing order of models in the array (frontier -> mid -> budget)
9. Preserve `providerColor` values — do not change these

---

## Step 6 — Update Constants if Needed

If any model IDs changed or new models were added, update `src/data/constants.ts`:

- `PRESETS` — model ID arrays (add new model to relevant presets if appropriate)
- `DEFAULT_SELECTED` — default selected model IDs
- `OPEN_SOURCE_IDS` — add if the model is open source
- `DATA_LAST_UPDATED` — **always update to today's date** (format: `YYYY-MM-DD`)
- `PROVIDERS` is auto-derived, no manual update needed

---

## Step 7 — Format and Verify

Run these commands:

```bash
npx prettier --write src/data/models.json src/data/constants.ts
pnpm build
```

If the build fails, fix the issue and retry.

---

## Step 8 — Summary

Print a summary table showing what changed:

```
| Model | Field | Old Value | New Value | Source |
|-------|-------|-----------|-----------|--------|
| ...   | ...   | ...       | ...       | ...    |
```

For each value, indicate the source it came from. Flag any fields set to `null` due to missing data.

---

## Adding a New Model

If the user asks to add a new model (not just update existing ones):

1. **Search first** — Use WebSearch to confirm the model exists and find its specs
2. Ask for (or look up): model name, provider, OpenRouter ID, tier
3. Gather all data following Steps 2-4
4. Choose a short `id` (lowercase, no hyphens, e.g. `gpt5`, `opus46`)
5. Pick the provider's existing `providerColor`, or ask the user for a new one
6. Insert the model in the correct tier section of `models.json`
7. Ask if it should be added to any presets in `constants.ts`
8. **If many fields end up as `null`** (e.g. model is too new), warn the user and ask if they still want to add it — it may be better to wait until more data is available
