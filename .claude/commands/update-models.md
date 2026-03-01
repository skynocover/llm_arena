---
description: Update LLM model data (pricing, speed, latency, benchmarks) in models.json
argument-hint: Model ID to update (e.g. "gpt5", "opus46") or "all" for everything
---

# Update Models Data

You are updating `src/data/models.json` with the latest pricing, performance, and benchmark data for LLM models.

**Target:** $ARGUMENTS (if empty, ask the user which models to update or whether to update all)

---

## Step 0 — Understand the Schema

Read these files first:

- `src/types/model.ts` — the `Model` interface defines every field
- `src/data/models.json` — current model data
- `src/data/constants.ts` — presets and defaults that reference model IDs

Every model object must have these fields:

| Field           | Type           | Description                                               |
| --------------- | -------------- | --------------------------------------------------------- |
| `id`            | string         | Short stable ID used in code (e.g. `gpt5`)                |
| `openrouterId`  | string         | OpenRouter API model ID (e.g. `openai/gpt-5`)             |
| `name`          | string         | Display name                                              |
| `provider`      | string         | Provider company name                                     |
| `providerColor` | string         | Hex color for the provider                                |
| `input`         | number         | Input price per 1M tokens (USD)                           |
| `output`        | number         | Output price per 1M tokens (USD)                          |
| `cached`        | number \| null | Cached input price per 1M tokens, null if unavailable     |
| `context`       | number         | Context window size in tokens                             |
| `maxOutput`     | number         | Max output tokens                                         |
| `speed`         | number         | Output speed in tokens/sec (from Artificial Analysis)     |
| `latency`       | number         | Time to first token in seconds (from Artificial Analysis) |
| `coding`        | number         | HumanEval / LiveCodeBench score (0-100)                   |
| `mmlu`          | number         | MMLU-Pro score (0-100)                                    |
| `gpqa`          | number         | GPQA Diamond score (0-100)                                |
| `math`          | number         | MATH-500 score (0-100)                                    |
| `swe`           | number         | SWE-Bench Verified score (0-100)                          |
| `aime`          | number         | AIME 2025 score (0-100)                                   |
| `quality`       | number         | Artificial Analysis Quality Index                         |
| `tier`          | string         | One of: `frontier`, `mid`, `budget`                       |

---

## Step 1 — Fetch Pricing from OpenRouter

Use WebFetch to call the OpenRouter API:

```
GET https://openrouter.ai/api/v1/models
```

Extract for each target model:

- `pricing.prompt` — input price (per token → convert to per 1M tokens)
- `pricing.completion` — output price (per token → convert to per 1M tokens)
- `context_length` — context window
- `top_provider.max_completion_tokens` — max output tokens

**Price conversion:** OpenRouter returns price per token as a string. Multiply by 1,000,000 to get price per 1M tokens.

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

| Model ID        | OpenRouter ID                 |
| --------------- | ----------------------------- |
| sonnet46        | anthropic/claude-sonnet-4.6   |
| gpt41           | openai/gpt-4.1                |
| deepseekv3      | deepseek/deepseek-v3.2        |
| deepseekr1      | deepseek/deepseek-r1          |
| qwen3235b       | qwen/qwen3-235b-a22b-instruct |
| mistrallarge3   | mistralai/mistral-large-2512  |
| llama4maverick  | meta-llama/llama-4-maverick   |
| gemini3flash    | google/gemini-3-flash-preview |
| o4mini          | openai/o4-mini                |
| gpt5mini        | openai/gpt-5-mini             |
| gpt41mini       | openai/gpt-4.1-mini           |
| grok41fast      | x-ai/grok-4.1-fast            |
| grokcode1       | x-ai/grok-code-fast-1         |
| sonnet45        | anthropic/claude-sonnet-4.5   |
| deepseekr10528  | deepseek/deepseek-r1-0528     |
| devstral2       | mistralai/devstral-2512       |
| kimik2think     | moonshotai/kimi-k2-thinking   |
| minimaxm1       | minimax/minimax-m1            |
| mistralmedium31 | mistralai/mistral-medium-3.1  |

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
| grok3mini         | x-ai/grok-3-mini                         |
| qwen35flash       | qwen/qwen3.5-flash-02-23                 |
| qwen3coder        | qwen/qwen3-coder-next                    |
| glm47flash        | z-ai/glm-4.7-flash                       |
| seed20mini        | bytedance-seed/seed-2.0-mini             |

---

## Step 2 — Fetch Performance Data from Artificial Analysis

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

| Model ID          | AA Slug               |
| ----------------- | --------------------- |
| haiku45           | claude-3-5-haiku      |
| gpt4omini         | gpt-4o-mini           |
| gptoss20b         | gpt-oss-20b           |
| gemini25flash     | gemini-2-5-flash      |
| llama4scout       | llama-4-scout         |
| phi4              | phi-4                 |
| gemma327b         | gemma-3-27b           |
| mistralsmall3     | mistral-small-3       |
| gpt5nano          | gpt-5-nano            |
| gpt41nano         | gpt-4-1-nano          |
| gemini25flashlite | gemini-2-5-flash-lite |
| grok3mini         | grok-3-mini-reasoning |
| qwen35flash       | qwen3-5-flash         |
| qwen3coder        | qwen3-coder-next      |
| glm47flash        | glm-4-7-flash         |
| seed20mini        | seed-2-0-mini         |

If the AA page doesn't load or the slug is wrong, try searching:

```
https://artificialanalysis.ai/leaderboards/models
```

---

## Step 3 — Fetch Benchmark Scores

For each target model, search for the latest benchmark scores. Use WebSearch to find:

1. **HumanEval / LiveCodeBench** → `coding` field
2. **MMLU-Pro** → `mmlu` field
3. **GPQA Diamond** → `gpqa` field
4. **MATH-500** → `math` field
5. **SWE-Bench Verified** → `swe` field
6. **AIME 2025** → `aime` field

### Search strategies:

- Search `"{model name}" benchmark scores {current year}`
- Check the model's official announcement blog post
- Check `https://artificialanalysis.ai/leaderboards/models` for aggregated scores
- Check provider pages (e.g. OpenAI, Anthropic, Google blog posts)

### Additional data sources by provider:

| Source                              | URL                                                 | What it has                                    |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| **Artificial Analysis**             | `https://artificialanalysis.ai/models/{slug}`       | speed, latency, quality index, some benchmarks |
| **Artificial Analysis Leaderboard** | `https://artificialanalysis.ai/leaderboards/models` | cross-model comparison                         |
| **HuggingFace Model Cards**         | `https://huggingface.co/{org}/{model}`              | official benchmark tables from providers       |
| **Automatio.ai**                    | `https://automatio.ai/models/{slug}`                | consolidated benchmark scores                  |
| **LLM Stats**                       | `https://llm-stats.com/models/{slug}`               | benchmarks, pricing, context                   |
| **Vellum LLM Leaderboard**          | `https://www.vellum.ai/llm-leaderboard`             | cross-model benchmark comparison               |
| **OpenRouter Model Page**           | `https://openrouter.ai/{provider}/{model}`          | pricing, context, max output                   |

### Provider-specific sources:

| Provider      | Source                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------- |
| **OpenAI**    | `https://openai.com/api/pricing/`, blog posts at `openai.com/index/`                      |
| **Anthropic** | `https://platform.claude.com/docs/en/about-claude/pricing`, blog at `anthropic.com/news/` |
| **Google**    | Model cards at `https://deepmind.google/models/`, `ai.google.dev/gemini-api/docs/models`  |
| **DeepSeek**  | HuggingFace cards at `huggingface.co/deepseek-ai/`, arXiv papers                          |
| **xAI**       | `https://docs.x.ai/developers/models`, blog at `x.ai/news/`                               |
| **Qwen**      | HuggingFace cards at `huggingface.co/Qwen/`, blog at `qwenlm.github.io`                   |
| **Mistral**   | HuggingFace cards at `huggingface.co/mistralai/`, docs at `docs.mistral.ai`               |
| **Moonshot**  | HuggingFace cards at `huggingface.co/moonshotai/`                                         |
| **MiniMax**   | HuggingFace cards at `huggingface.co/MiniMaxAI/`                                          |
| **ByteDance** | Official page at `https://seed.bytedance.com/en/seed2`                                    |
| **Zhipu AI**  | HuggingFace cards at `huggingface.co/zai-org/`                                            |
| **Meta**      | HuggingFace cards at `huggingface.co/meta-llama/`                                         |
| **Microsoft** | HuggingFace cards at `huggingface.co/microsoft/`                                          |

### Data source priority (highest to lowest):

1. **HuggingFace model cards** — official benchmark tables from the provider
2. **Artificial Analysis** — speed, latency, quality index, leaderboard data
3. **Official provider** documentation / blog posts / arXiv papers
4. **Automatio.ai / LLM Stats** — consolidated third-party benchmark data
5. **OpenRouter** API response — pricing, context, max output
6. **Vellum Leaderboard** — cross-model benchmark comparison
7. **Estimates** (only as last resort, flag these to the user)

---

## Step 4 — Compile and Update

1. Merge all gathered data into the model objects
2. Round prices to 2 decimal places
3. Round benchmark scores to 1 decimal place
4. Round speed to nearest integer
5. Round latency to 2 decimal places
6. Update `src/data/models.json` using the Edit tool
7. Preserve the existing order of models in the array (frontier → mid → budget)
8. Preserve `providerColor` values — do not change these

---

## Step 5 — Update Constants if Needed

If any model IDs changed, update `src/data/constants.ts`:

- `PRESETS` — model ID arrays
- `DEFAULT_SELECTED` — default selected model IDs
- `PROVIDERS` is auto-derived, no manual update needed

---

## Step 6 — Format and Verify

Run these commands:

```bash
npx prettier --write src/data/models.json src/data/constants.ts
pnpm build
```

If the build fails, fix the issue and retry.

---

## Step 7 — Summary

Print a summary table showing what changed:

```
| Model | Field | Old Value | New Value |
|-------|-------|-----------|-----------|
| ...   | ...   | ...       | ...       |
```

Flag any values that were estimated or could not be verified.

---

## Adding a New Model

If the user asks to add a new model (not just update existing ones):

1. Ask for: model name, provider, OpenRouter ID, tier
2. Gather all data following Steps 1-3
3. Choose a short `id` (lowercase, no hyphens, e.g. `gpt5`, `opus46`)
4. Pick the provider's existing `providerColor`, or ask the user for a new one
5. Insert the model in the correct tier section of `models.json`
6. Ask if it should be added to any presets in `constants.ts`
