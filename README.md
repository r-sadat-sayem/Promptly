# Promptly — Prompt Engineering Workbench

> **Internal Tool · ESDD, Rakuten**
> Built by Sadat Sayem · sadat.sayem@rakuten.com

Promptly is an AI-powered prompt engineering workbench that compresses, crafts, and optimizes LLM system prompts — reducing token usage and API costs on every call, with full transparency on what changed and why.

---

## What it does

Most system prompts in production are 30–60% longer than they need to be. Promptly uses Claude Sonnet 4.6 (via Rakuten AI Gateway) to:

- **Optimize** existing prompts — compress verbose language, remove filler, collapse redundant instructions, while preserving all constraints and safety rules
- **Craft** prompts from scratch — upload a reference document, describe your intent, and get a structured system prompt (role, task, DOs, DON'Ts) in under 30 seconds
- **Track ROI** — every optimization is recorded; token savings are projected into real cost figures using a configurable model pricing catalog
- **Show every change** — word-level diff, itemized change log, and a quality confidence score on every result

---

## Features

| Feature | Description |
|---------|-------------|
| Prompt Optimizer | 7 compression techniques, SSE-streamed results |
| Document-Aware Crafter | Upload PDF/text → structured system prompt |
| Auto-Optimize Pipeline | Craft then optimize in one click |
| Quality Confidence Score | 0.0–1.0 rating on every optimization |
| Word-Level Diff Viewer | Color-coded word-by-word comparison |
| Live Token Counter | Real-time tiktoken counts on every keystroke |
| AI Coach Chatbot | Floating assistant explains changes in plain language |
| ROI Intelligence Dashboard | Tracks savings, projects annual cost impact |
| Model Pricing Catalog | 8 model presets (Claude, GPT, Gemini) + custom |
| Prompt Engineering Tips | 12 evidence-based tips (Anthropic + OpenAI guidelines) |
| Self-Refine Optimization Loop | Evaluate → critique → refine with early stopping |
| Persistent Cache + Knowledge Base | Reuse exact and similar optimizations across runs |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Access to the Rakuten AI Gateway (internal network)

### Install

```bash
npm install
```

### Configure environment

Create `.env.local` at the project root:

```env
RAKUTEN_AI_GATEWAY_KEY=your_bearer_token_here
MODEL_ID=claude-sonnet-4-6
```

> **Note:** `RAKUTEN_AI_GATEWAY_KEY` is the bearer token for the Rakuten AI Gateway. `MODEL_ID` defaults to `claude-sonnet-4-6` if omitted.

### Run

```bash
node node_modules/next/dist/bin/next dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page.
Open [http://localhost:3000/app](http://localhost:3000/app) for the workbench directly.

---

## Project Structure

```
token-optimizer/
├── app/
│   ├── page.tsx              # Landing page (Server Component)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind v4 + base styles
│   └── app/
│       └── page.tsx          # Main workbench (Client Component)
│   └── api/
│       ├── optimize/
│       │   └── route.ts      # SSE stream — optimize & craft
│       ├── chat/
│       │   └── route.ts      # SSE stream — AI coach chatbot
│       └── savings/
│           ├── route.ts      # GET stats / POST record
│           └── config/
│               └── route.ts  # PATCH ROI config
├── components/
│   ├── PromptEditor.tsx      # Two-panel textarea with token counts
│   ├── TokenStats.tsx        # Before/after stats + quality bar
│   ├── ExplanationPanel.tsx  # Collapsible change log
│   ├── DiffViewer.tsx        # Word-level diff renderer
│   ├── ChatBot.tsx           # Floating AI coach sidebar
│   ├── FileUpload.tsx        # Document upload for Craft tab
│   ├── SavingsPanel.tsx      # ROI Intelligence Dashboard
│   └── TipsCarousel.tsx      # Prompt engineering tips carousel
├── lib/
│   ├── aiClient.ts           # Anthropic SDK → Rakuten AI Gateway
│   ├── optimizer.ts          # Prompt templates + OptimizationResult types
│   ├── optimizationPipeline.ts # Server-side optimization orchestration
│   ├── knowledgeBase.ts      # Exact cache + similarity lookup + persistence
│   ├── llmJson.ts            # Deterministic JSON-only LLM helper
│   ├── promptUtils.ts        # Normalization, hashing, similarity, token guards
│   ├── optimizationConfig.ts # Iteration limits and scoring thresholds
│   ├── optimizationLogger.ts # Structured optimization logs
│   ├── tokenCounter.ts       # tiktoken wrapper with memoization
│   └── db.ts                 # SQLite setup + migrations
├── data/
│   └── promptly.db           # SQLite database (auto-created)
├── PRODUCT.md                # Full product feature document + presentation deck
└── .env.local                # Environment variables (not committed)
```

---

## Optimization Architecture

The UI still calls `POST /api/optimize`, but the route is now a thin wrapper around a server-side pipeline in `lib/optimizationPipeline.ts`. The pipeline owns request normalization, exact-cache lookup, similarity search against stored learnings, candidate generation, evaluation, self-refinement, persistence, and structured logging.

The system is intentionally lightweight:

- **API layer**: validates input and returns SSE responses
- **Pipeline layer**: coordinates optimization decisions and stop conditions
- **LLM layer**: uses JSON-only completions for generation, evaluation, and refinement
- **Persistence layer**: stores savings data, exact cache entries, and reusable knowledge in SQLite
- **Safety layer**: enforces token budgets, max iterations, stagnation stopping, and knowledge write thresholds

### Optimization Pipeline

```text
incoming_prompt
  ↓
exact cache lookup
  ↓
similarity search in knowledge base
  ↓
cache hit? → return stored optimized prompt
  ↓
generate candidate
  ↓
evaluate candidate
  ↓
self-refine loop (max 5 iterations)
  ↓
early stop if improvement < 5% for 2 consecutive iterations
  ↓
store exact cache
  ↓
store knowledge if accuracy >= 0.85 and token reduction >= 10%
  ↓
return best prompt
```

The similarity layer is deterministic and dependency-free today: it uses normalized lexical overlap instead of embeddings because no embedding provider is configured in this repository.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) |
| AI SDK | `@anthropic-ai/sdk` → Rakuten AI Gateway |
| Token counting | `js-tiktoken` — client-side, zero API calls |
| Diff rendering | `diff` package — word-level |
| Database | `better-sqlite3` — SQLite, WAL mode |
| Streaming | Server-Sent Events (SSE) |
| Runtime | Node.js 18+ |

---

## API Routes

### `POST /api/optimize`

Streams an optimization or craft result via SSE.

**Body:**
```json
{
  "prompt": "string",
  "fileContent": "string (optional, for craft mode)",
  "fileName": "string (optional)",
  "craftAsSystemPrompt": "boolean (optional)"
}
```

Behavior:

- Uses exact cache lookup before any LLM call
- Reuses similar prior optimizations from the knowledge base when similarity is high enough
- Runs a self-refine loop with generation, evaluation, critique, and bounded refinement
- Returns the best candidate plus metadata such as source (`llm`, `exact-cache`, `similarity-cache`) and iteration count

**SSE events:** `chunk` (optimized text) · `done` (final `OptimizationResult` JSON) · `error`

---

### `POST /api/chat`

Streams an AI coach response via SSE.

**Body:**
```json
{
  "message": "string",
  "context": {
    "original": "string",
    "optimized": "string",
    "changes": ["string"]
  }
}
```

---

### `GET /api/savings`

Returns ROI dashboard data.

**Response:**
```json
{
  "totalTokensSaved": 84200,
  "totalRuns": 47,
  "avgCompressionPct": 41,
  "weeklyBreakdown": [{ "label": "Mon", "tokens": 1200 }],
  "recentRuns": [{ "timestamp": 1700000000, "tokensBefore": 850, "tokensAfter": 340, "tokensSaved": 510 }],
  "config": {
    "dailyCalls": 10000,
    "pricePerMillion": 3.0,
    "modelName": "Claude Sonnet 4.6",
    "currency": "USD",
    "usdToJpy": 155
  }
}
```

---

### `POST /api/savings`

Records a new optimization run.

**Body:** `{ "type": "optimize", "tokensBefore": 850, "tokensAfter": 340 }`

---

### `PATCH /api/savings/config`

Updates ROI configuration.

**Body (all fields optional):**
```json
{
  "dailyCalls": 10000,
  "pricePerMillion": 3.0,
  "modelName": "Claude Sonnet 4.6",
  "currency": "USD",
  "usdToJpy": 155
}
```

---

## Database

SQLite file at `data/promptly.db` (auto-created on first run). Schema:

```sql
CREATE TABLE savings_records (
  id            TEXT    PRIMARY KEY,
  timestamp     INTEGER NOT NULL,
  type          TEXT    NOT NULL,
  tokens_before INTEGER NOT NULL,
  tokens_after  INTEGER NOT NULL,
  tokens_saved  INTEGER NOT NULL
);

CREATE TABLE savings_config (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  daily_calls       INTEGER NOT NULL DEFAULT 10000,
  price_per_million REAL    NOT NULL DEFAULT 1500,
  model_name        TEXT    DEFAULT 'Custom',
  currency          TEXT    DEFAULT 'JPY',
  usd_to_jpy        REAL    DEFAULT 155
);

CREATE TABLE optimization_cache (
  cache_key          TEXT    PRIMARY KEY,
  prompt_hash        TEXT    NOT NULL,
  mode               TEXT    NOT NULL,
  normalized_prompt  TEXT    NOT NULL,
  normalized_file_hash TEXT,
  optimized_prompt   TEXT    NOT NULL,
  changes_json       TEXT    NOT NULL,
  quality_confidence REAL    NOT NULL,
  quality_notes      TEXT    NOT NULL,
  metadata_json      TEXT,
  created_at         INTEGER NOT NULL,
  last_hit_at        INTEGER NOT NULL,
  hit_count          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE optimization_knowledge (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_hash             TEXT    NOT NULL,
  mode                    TEXT    NOT NULL,
  normalized_prompt       TEXT    NOT NULL,
  original_prompt_pattern TEXT    NOT NULL,
  optimized_prompt        TEXT    NOT NULL,
  token_reduction         REAL    NOT NULL,
  accuracy_score          REAL    NOT NULL,
  optimization_rules_json TEXT    NOT NULL,
  timestamp               INTEGER NOT NULL
);
```

`optimization_cache` stores exact reusable results keyed by normalized request inputs. `optimization_knowledge` stores high-quality learnings only when the optimizer preserves accuracy and achieves meaningful token reduction.

Migrations run automatically on startup and new tables are created lazily on first boot.

---

## Prompt Engineering Tips

The app includes 12 tips derived from official guidelines:

- **Anthropic Prompt Engineering Guide** — `docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview`
- **OpenAI Prompt Engineering Guide** — `platform.openai.com/docs/guides/prompt-engineering`

Tips cover: specificity, imperative voice, role assignment, XML structure (Claude), few-shot examples, system/user separation, chain of thought, output format, positive instructions, delimiter security, context minimalism, and systematic testing.

---

## Key Notes

- **No external data** — prompt content is processed through the internal Rakuten AI Gateway; SQLite stores ROI metrics, exact cache entries, and high-quality optimization learnings
- **No auth required** — internal tool for trusted ESDD team members
- **Google Fonts disabled** — uses system fonts (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto`)
- **TypeScript check:** `node node_modules/typescript/bin/tsc --noEmit` (avoid `npx tsc` in this env)
- **Direct build command:** `node node_modules/next/dist/bin/next build` can be more reliable than `npm run build` in this environment

---

## Full Product Documentation

See [`PRODUCT.md`](./PRODUCT.md) for the complete product feature document and presentation deck — including feature deep-dives, architecture diagram, ROI calculations, and 12-slide presentation content.

---

*Promptly · ESDD, Rakuten · © 2025 Sadat Sayem*
