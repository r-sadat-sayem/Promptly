# Promptly — Product Feature Document & Presentation Content

> **Internal Tool · ESDD, Rakuten**
> Built by Sadat Sayem · sadat.sayem@rakuten.com

---

## Part I — Product Feature Document

---

### Opening Statement

> *Every time a system prompt fires, you pay for every token in it — even the ones that don't need to be there.
> Most prompts in production are 30–60% longer than they need to be.
> Promptly closes that gap.*

AI is now a cost line on the ESDD team's balance sheet. The Rakuten AI Gateway routes real traffic, sends real tokens, and generates real bills on every API call. Unlike compute costs that scale with users, **prompt token costs scale with quality of engineering** — and most teams have never had a dedicated tool to improve that number.

Promptly was built to be that tool. It doesn't change what your AI does. It changes how much you pay for it to do it.

---

### Product Overview

| | |
|---|---|
| **Product name** | Promptly |
| **Type** | Internal web tool (Next.js App Router) |
| **Owner** | ESDD, Rakuten — Sadat Sayem |
| **Access** | `/app` route on internal deployment |
| **Backend AI** | Claude Sonnet 4.6 via Rakuten AI Gateway |
| **Token tracking** | js-tiktoken (client-side, real-time) |
| **Data persistence** | SQLite via better-sqlite3 (ROI + cache + knowledge base) |

---

### The Problem Promptly Solves

LLM pricing is charged per token. Input tokens — the instructions you write in a system prompt — are paid on **every single API call**, regardless of how long the conversation is. A system prompt that says:

> *"Please ensure that you always remember to respond in a professional manner, keeping in mind that it is important to be thorough…"*

costs the same or more than one that says:

> *"Respond professionally and thoroughly."*

The second is semantically identical. The first has 3× the tokens. At 10,000 calls/day, that difference compounds into millions of wasted tokens per month.

Promptly automates the engineering judgment needed to close that gap — safely, verifiably, and with full transparency on what changed.

---

### Core Feature Set

---

#### Feature 1 — Prompt Optimizer

**What it does:**
Analyzes an existing system prompt using Claude Sonnet 4.6 and returns a compressed version that preserves all intent, constraints, and safety rules while eliminating redundant language. The optimizer now runs as a bounded server-side pipeline with evaluation and self-refinement rather than a single unreviewed rewrite.

**The optimization engine applies 7 techniques:**

| Technique | Example |
|-----------|---------|
| Filler phrase removal | `"Please ensure that you always"` → removed |
| Redundant instruction collapse | Duplicate intent merged into one statement |
| Prose-to-bullet conversion | Multi-sentence paragraphs → tight bullet lists |
| Inferrable example removal | Self-evident examples dropped; non-obvious kept |
| Hedge word elimination | `"Generally speaking, you should try to"` → removed |
| Phrase compression | `"in order to"` → `"to"`, `"due to the fact that"` → `"because"` |
| Formatting instruction merge | Overlapping style/tone rules consolidated |

**What it never removes:**
- Hard constraints and behavioral rules
- Safety instructions and guardrails
- Domain-specific facts and knowledge
- Non-obvious edge-case examples
- Precise behavioral specifications

**Output format:**
- Optimized prompt text
- Change log — an enumerated list of every modification made
- Quality confidence score (0.0–1.0)
- Quality notes — plain-language summary of what was preserved and any caveats

**Runtime safeguards:**
- Maximum 5 refinement iterations
- Early stopping when improvement stagnates
- Token-growth checks to prevent prompt expansion
- Exact-cache and similarity reuse to avoid unnecessary LLM calls

---

#### Feature 2 — Quality Confidence Score

**What it does:**
Every optimization result ships with a machine-assessed confidence score that tells users exactly how safe it is to deploy the optimized prompt without further review. Internally, the score is now informed by an evaluation step that checks accuracy, clarity, and constraint preservation during the refinement loop.

**Scoring guide:**

| Score | Meaning |
|-------|---------|
| 0.95+ | All constraints preserved · significant size reduction · no semantic loss |
| 0.85–0.94 | Minor ambiguity introduced but intent preserved |
| 0.70–0.84 | Some nuance lost · core behavior maintained |
| < 0.70 | Use caution · manual review strongly recommended |

**Why this matters:**
Teams don't have time to read every diff on every optimization. The confidence score gives a single, actionable signal: if it's above 0.95, ship it. If it's below 0.85, read the diff. This turns prompt optimization from a risky manual process into a reviewable, traceable workflow.

---

#### Feature 3 — Document-Aware Prompt Crafter

**What it does:**
Accepts a reference document (PDF, text, markdown) plus a rough intent description, and crafts a complete, production-ready system prompt from scratch — structured, efficient, and targeted to the document's domain.

**The output structure (enforced by the AI):**
1. **Role + Task** — 1–2 sentences defining the AI's function
2. **Document usage** — how the LLM should interact with the provided context
3. **DO rules** — 2–3 specific required behaviors
4. **DON'T rules** — 2–3 explicit prohibitions

**Target output size:** 80–200 tokens. The crafter is instructed to be as tight as the task allows — it never pads.

**Key rules the crafter follows:**
- Never copies document content into the prompt (document is provided separately at runtime)
- Only adds output format instructions if clearly implied by the user's intent
- Uses imperative voice throughout — `"Do X"` not `"Please ensure you do X"`

**Use case:** An analyst uploads a 40-page product spec PDF and writes `"help users understand this product"`. Promptly generates a precise system prompt — role, task, constraints — in under 30 seconds, ready to attach to any API call.

---

#### Feature 4 — Auto-Optimize Pipeline

**What it does:**
Allows users to run Craft and Optimize back-to-back in a single action. After crafting a prompt from a document, checking the "Auto-optimize after crafting" toggle runs the optimizer immediately on the crafted output — delivering a document-grounded, fully compressed prompt in one step.

**Why this matters:**
Without this, users would need to: craft → copy → switch tabs → paste → optimize. With the pipeline, it's one click. The crafted prompt is already structured; the optimizer then removes any remaining inefficiency. The combined result is consistently leaner than either step alone.

**Current optimization pipeline behind the scenes:**
- Exact cache lookup before any LLM call
- Similarity search against stored high-quality prior optimizations
- Candidate generation
- Evaluation and critique
- Self-refinement loop (max 5 iterations)
- Early stop if improvement is below threshold twice in a row
- Cache write for exact reuse
- Knowledge-base write only when quality and token-reduction thresholds are met

---

#### Feature 5 — Visual Word-Level Diff

**What it does:**
Renders a precise, color-coded comparison between the original and optimized prompt at the word level using the `diff` library.

- **Red highlight** — words removed from the original
- **Green highlight** — words added or restructured in the optimized version
- Nothing is hidden or aggregated — every single change is surfaced

**Why this matters:**
Token optimization is an inherently trust-sensitive operation. Teams need to verify that nothing important was dropped before deploying an optimized prompt to production. The diff view makes that review fast, exact, and visual — no side-by-side comparison needed, no guesswork.

---

#### Feature 6 — Built-in AI Coach (ChatBot)

**What it does:**
A floating AI assistant sidebar — powered by Claude Sonnet 4.6 — that operates in the context of the current optimization session. Users can ask questions in plain language and get expert-level answers about prompt engineering.

**The coach's capabilities:**
- Explain exactly why specific changes were made in the current result
- Teach prompt optimization techniques accessible to non-engineers
- Guide users on writing efficient prompts from the start
- Explain trade-offs between brevity and clarity
- Answer questions about token costs and how they affect API pricing

**Response format:** The coach uses structured markdown — bold for key terms, bullets for techniques, code formatting for prompt examples — and is instructed to keep paragraphs to 2–3 sentences maximum.

**Why this matters:**
Most prompt engineers learn by trial and error. The coach turns every optimization into a teaching moment — users don't just get a better prompt, they understand why it's better and learn to write more efficiently next time.

---

#### Feature 7 — Live Token Counter

**What it does:**
Displays real-time token counts for both the original and optimized prompts using `js-tiktoken` running client-side. Updates on every keystroke with zero server round-trips.

**Displays:**
- Token count for original prompt
- Token count for optimized prompt
- Token delta (savings)
- Percentage reduction

**Why this matters:**
Token counts are invisible in most editors. Without a live counter, engineers have no feedback loop when writing prompts — they don't know if their edits are making prompts larger or smaller. Promptly makes token cost a first-class, always-visible metric.

---

#### Feature 8 — ROI Intelligence Dashboard

**What it does:**
A live ROI panel that tracks every optimization run, accumulates real token savings data in a local SQLite database, and projects those savings into monetary terms using configurable model pricing.

**Metrics tracked:**
- Total tokens saved (lifetime)
- Total optimization runs
- Average compression rate (computed from real before/after token counts per run)
- Weekly token savings breakdown (7-day bar chart)
- Last 5 optimization runs with before/after/saved/cost-per-day

**Configuration:**

| Setting | Description |
|---------|-------------|
| Model preset | Select from 9 models with auto-filled USD pricing |
| Display currency | USD or JPY |
| Exchange rate | Configurable ¥/$ rate (default ¥155) |
| Daily API calls | How many times/day the prompt runs in production |

**Model pricing catalog (built-in):**

| Model | Input $/1M tokens |
|-------|-------------------|
| Claude Opus 4 | $15.00 |
| Claude Sonnet 4.6 | $3.00 |
| Claude Haiku 4.5 | $0.80 |
| GPT-4o | $2.50 |
| GPT-4o mini | $0.15 |
| Gemini 1.5 Pro | $1.25 |
| Gemini 1.5 Flash | $0.075 |
| Gemini 2.0 Flash | $0.10 |
| Custom | Manual entry |

**Projected savings formula:**
```
savedToDate    = (totalTokensSaved / 1M) × pricePerMillion
projectedPerYr = (avgTokensSavedPerRun × dailyCalls × 365 / 1M) × pricePerMillion
costPerRunDay  = (tokensSaved / 1M) × pricePerMillion × dailyCalls
```

**Copy Report:** One-click export of the full ROI summary as formatted plain text — ready to paste into a Slack message, email, or budget review.

---

#### Feature 9 — Tooltip Knowledge Layer

**What it does:**
Every technical term in the ROI dashboard and configuration modal is annotated with a plain-language `?` tooltip — designed for non-technical stakeholders (managers, product owners, finance).

**Tooltip glossary:**

| Term | Plain-language explanation |
|------|---------------------------|
| Tokens | Chunks of text an AI reads/writes — roughly ¾ of a word. More tokens = higher cost. |
| Input tokens | The instructions sent to the AI. Optimizing these reduces cost on every call. |
| 1M tokens | ≈ 750,000 words — roughly 1,500 pages of text. |
| Daily calls | How many times/day your products call the AI with this prompt. |
| Projected/yr | Estimated savings over a full year at configured call volume. |
| Compression rate | How much shorter the optimized prompt is vs. the original. |

---

#### Feature 10 — File Upload & Document Ingestion

**What it does:**
Accepts any document file in the Craft tab. The file content is read client-side and passed alongside the user's rough intent to the AI. Supported formats include PDF, TXT, markdown, and other text-based documents.

**Current file context:** The loaded filename is displayed in the UI so users always know which document is active. Switching tabs or resetting the session clears the document to prevent stale context.

---

### Technical Architecture

```
Browser UI
  PromptEditor / DiffViewer / TokenStats / SavingsPanel / ChatBot
      |
      | SSE + REST
      v
Next.js API Routes
  /api/optimize
  /api/chat
  /api/savings
  /api/savings/config
      |
      v
Optimization Pipeline (server-side)
  normalize request
  -> exact cache lookup
  -> similarity search in knowledge base
  -> candidate generation
  -> evaluation
  -> self-refine loop
  -> cache write
  -> knowledge write
      |
      +--> Rakuten AI Gateway (Claude Sonnet 4.6)
      |
      +--> SQLite (`data/promptly.db`)
           - savings_records
           - savings_config
           - optimization_cache
           - optimization_knowledge
```

**Stack summary:**

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Styling | Tailwind CSS v4 |
| AI SDK | @anthropic-ai/sdk → Rakuten AI Gateway |
| Token counting | js-tiktoken (client-side, no API calls) |
| Diff rendering | diff package (word-level) |
| Database | better-sqlite3 (SQLite, WAL mode) |
| Streaming | Server-Sent Events (SSE) |

---

### Optimization Pipeline

```
incoming prompt
  -> exact cache lookup
  -> similarity search
  -> cache hit? return stored result
  -> generate candidate
  -> evaluate candidate
  -> critique + refine
  -> repeat up to 5 iterations
  -> stop early if improvement < 5% twice in a row
  -> store exact cache entry
  -> store learning if accuracy >= 0.85 and token reduction >= 10%
  -> return best prompt
```

This flow keeps the system deterministic and bounded. It reduces repeated LLM usage while preserving the existing user-facing API and UI.

---

### Data & Privacy

- All optimization runs are processed via the **Rakuten AI Gateway** — no data leaves the internal network to external AI providers directly
- Runtime data is stored in a **local SQLite file** (`data/promptly.db`) — no external database
- No user accounts, no authentication — internal tool accessed by trusted ESDD team members
- ROI metrics are stored for dashboard reporting
- Exact optimization cache entries are stored for reuse
- High-quality optimization learnings may be stored to support future similarity-based reuse

**Note:** similarity reuse is currently implemented with deterministic lexical overlap rather than embeddings, because no embedding provider is configured in this repository.

---

---

## Part II — Presentation Deck

*Slide-by-slide content with speaker notes for a 10–12 minute walkthrough*

---

### Slide 1 — Title

**Headline:**
# Promptly
## The Prompt Engineering Workbench for ESDD

**Subline:**
*Write smarter prompts. Pay less on every call.*

**Speaker notes:**
> Start with a pause. Let the title breathe. Then open with: "I want to talk about a cost that most of us don't think about — because it doesn't come with an invoice, it's embedded in something we already pay for. AI token costs."

---

### Slide 2 — The Problem (The Hook)

**Headline:**
## You're paying for words that don't need to be there.

**Body:**
Every AI API call charges for every input token.
Most system prompts in production are **30–60% longer** than necessary.
That's not a content problem. It's an engineering problem.

**Visual:**
Two prompts side by side:

> ❌ *"Please ensure that you always remember to respond to the user in a professional manner, keeping in mind at all times that it is important to be both thorough and accurate in your responses."*
> → **38 tokens**

> ✅ *"Respond professionally, thoroughly, and accurately."*
> → **8 tokens**

**Callout:** *Same behavior. 79% fewer tokens.*

**Speaker notes:**
> "Both of those prompts produce the same output. The first one just costs 4.7× more — on every single call, forever. Most teams have dozens of prompts like the first one running in production right now. Promptly fixes that."

---

### Slide 3 — The Scale of the Problem

**Headline:**
## Small inefficiencies compound fast.

**Visual (table):**

| | Conservative | Moderate | High-volume |
|--|--|--|--|
| Calls/day | 1,000 | 10,000 | 100,000 |
| Tokens wasted/call | 200 | 500 | 800 |
| Tokens wasted/day | 200K | 5M | 80M |
| Cost/year (Sonnet 4.6) | ~¥34K | ~¥860K | ~¥13.8M |

**Callout:** *These are conservative estimates. Real savings depend on your prompts.*

**Speaker notes:**
> "At 10,000 calls a day — which is well within range for a mid-size product team — 500 wasted tokens per call is ¥860,000 a year. That's a junior engineer's monthly salary, quietly leaking out through verbose prompts. Promptly makes that waste visible and eliminates it."

---

### Slide 4 — What Promptly Does

**Headline:**
## One tool. Two workflows. Zero guesswork.

**Two columns:**

**Optimize**
> *"I already have a prompt. Make it leaner."*
- Paste your existing system prompt
- Claude analyzes and compresses it
- See a word-level diff of every change
- Get a quality confidence score
- Ship with confidence

**Craft**
> *"I have a document. Build me a prompt."*
- Upload any reference file
- Describe your intent in plain language
- Promptly writes the prompt from scratch — role, task, rules
- Optionally auto-optimize the result immediately

**Speaker notes:**
> "Promptly handles two common situations. The first: you have an existing prompt that's grown organically over time and you know it's bloated. The second: you have a document and you need to build a prompt around it — that's the Craft workflow."

---

### Slide 5 — The Optimizer in Depth

**Headline:**
## Intelligent compression. Seven specific techniques.

**Body (two columns):**

*What it removes:*
- Filler phrases ("Please ensure", "Keep in mind")
- Redundant instructions that repeat intent
- Inferrable examples
- Hedge words and obvious caveats
- Verbose phrase constructions

*What it never removes:*
- Hard constraints and behavioral rules
- Safety instructions and guardrails
- Domain-specific facts
- Edge-case examples
- Precise behavioral specifications

**Callout:**
> *Every run returns a quality confidence score. 0.95+ means ship it. Below 0.85 means read the diff.*

**Speaker notes:**
> "The optimizer is not a find-and-replace. It understands the semantic role of each sentence. A constraint like 'Never reveal the user's personal data' will never be touched, even if it's verbose. What gets removed is the noise that accumulates when prompts are written by committee or edited incrementally over months."

---

### Slide 6 — Quality Guarantee

**Headline:**
## You always know exactly what changed and why.

**Three panels:**

**① Word-Level Diff**
Green = added · Red = removed
Every word. No black boxes.

**② Change Log**
Itemized list of every edit:
- *"Removed filler: 'Please ensure that you always'"*
- *"Collapsed redundant instruction: merged sentence 3 and 7"*
- *"Compressed phrase: 'in order to' → 'to'"*

**③ Quality Score**
```
Confidence:  0.97  ████████████████████░
             "All constraints preserved. Filler and
              redundant phrasing removed. Safe to deploy."
```

**Speaker notes:**
> "This is the trust layer. No one is going to adopt a tool that silently modifies their prompts. The diff, the change log, and the confidence score together give teams everything they need to make an informed decision before they deploy."

---

### Slide 7 — The AI Coach

**Headline:**
## Not just a tool — a teacher.

**Body:**
Every Promptly session includes a built-in AI assistant that:
- Explains **why** each specific change was made
- Teaches prompt engineering techniques in plain language
- Answers questions about token costs and trade-offs
- Works for everyone — engineers and non-engineers alike

**Example conversation:**

> **User:** Why was "Please ensure that you always" removed?
>
> **Coach:** That phrase is what prompt engineers call a "filler opener." It adds social politeness to an instruction that doesn't need it — AI models don't require politeness, they require precision. Removing it saves 7 tokens and makes the remaining instruction clearer. A good rule: if the sentence means the same thing without the opener, delete it.

**Speaker notes:**
> "The coach turns every optimization into a learning moment. Engineers stop making the same verbose mistakes in new prompts. Over time, your team's prompt quality improves at the source — not just after the fact."

---

### Slide 8 — ROI Dashboard

**Headline:**
## Every saving is real. Every number is tracked.

**Visual (dashboard mockup):**

```
┌─ ROI Intelligence ─ [Claude Sonnet 4.6] ────────────────────┐
│  84.2K tokens saved  │  ¥253/saved  │  ¥92,000/yr projected │
├─────────────────────────────────────────────────────────────┤
│  Avg compression: 41%                                        │
│                                                              │
│  Recent Optimizations                                        │
│  Today 14:32  850→340 tok  510 saved  ¥0.77/day             │
│  Today 11:05  1,240→640    600 saved  ¥0.90/day             │
│  Yesterday    320→182 tok  138 saved  ¥0.21/day             │
└─────────────────────────────────────────────────────────────┘
```

**Callout:**
> *These numbers come from real runs. Every optimization logged automatically.*

**Speaker notes:**
> "This is what turns Promptly from a nice tool into a business case. When you walk into a budget review and someone asks 'what did we save on AI costs this quarter?', you open the dashboard and show them the number. Every token saved in this tool is tracked from day one."

---

### Slide 9 — How It Works (The Workflow)

**Headline:**
## From verbose to lean in under 60 seconds.

**Three-step flow:**

```
  ┌──────────┐        ┌──────────┐        ┌──────────┐
  │    01    │   →    │    02    │   →    │    03    │
  │ Paste or │        │  Run the │        │  Review  │
  │  upload  │        │    AI    │        │ and ship │
  └──────────┘        └──────────┘        └──────────┘

  Drop your prompt     Claude streams      Inspect the diff,
  or document into     the optimized       read the log,
  the tool.            result live.        copy and deploy.
```

**Speaker notes:**
> "Three steps, under a minute, zero API setup required. The tool runs entirely on the internal Rakuten AI Gateway — no external accounts, no API keys to manage. If you have access to the internal network, you can use Promptly today."

---

### Slide 10 — Real-World Numbers

**Headline:**
## What does a 40% compression actually mean?

**Before / After example (real optimization output):**

*Original (47 tokens):*
> *"You are a helpful AI assistant. Your primary role is to assist users with their questions in a professional and thorough manner. Please ensure that you always provide accurate information and remember to be polite and respectful at all times."*

*Optimized (11 tokens):*
> *"Respond professionally, accurately, and respectfully to user questions."*

**Savings breakdown:**

| Metric | Value |
|--------|-------|
| Tokens reduced | 36 tokens per call |
| At 10,000 calls/day | 360,000 tokens/day |
| At 365 days | 131.4M tokens/year |
| Cost saving (Sonnet 4.6 at $3/1M) | **$394/year · ¥61,000/year** |
| Quality confidence | 0.96 — safe to deploy |

**Speaker notes:**
> "From one prompt. One optimization. Imagine the team has 15–20 active system prompts. The savings stack. And this is a small prompt — enterprise prompts with hundreds of tokens show proportionally larger results."

---

### Slide 11 — For Non-Technical Stakeholders

**Headline:**
## What this means for the business.

**Three callout boxes:**

**💴 Cost reduction**
Every optimization run permanently reduces the token cost of that prompt for the lifetime of the product. It's a one-time 60-second action with a perpetual return.

**📊 Visibility**
For the first time, the team has a live dashboard that quantifies AI prompt efficiency. Cost-per-run, projections, compression rates — all in one place, no data engineering required.

**🎓 Team capability**
The AI coach improves the team's prompt engineering skills over time. The next prompt someone writes will be leaner than the last one — because they've seen what efficient looks like.

**Speaker notes:**
> "Promptly isn't just a developer tool. It generates the kind of numbers that belong in a quarterly business review — token savings, cost projections, compression rates. It makes the invisible cost of AI usage visible to everyone in the organization."

---

### Slide 12 — Closing Slide

**Headline:**
# The most expensive prompt is the one you never optimized.

**Body:**
Promptly is live. It's internal. It's built for the ESDD team.

Every prompt your team runs through it saves money — today, tomorrow, and on every API call that follows.

**Three asks:**

> **① Try it** — Open the app and run one optimization on any system prompt you own.
>
> **② Track it** — Configure the ROI dashboard with your model and daily call volume. Watch the number grow.
>
> **③ Share it** — If a team next to you is paying for bloated prompts, send them the link.

**Bottom line:**
> *This tool costs nothing to use and pays back on the first run.
> The only question is how long you wait before you start.*

---

**[ Open App → /app ]**

---

*Built with care for the ESDD team · Rakuten, Osaka*
*Contact: sadat.sayem@rakuten.com*

---

---

## Appendix — Quick Reference

### Optimization Rules Cheat Sheet

| Remove | Keep |
|--------|------|
| "Please ensure that you always" | Hard constraints |
| "It is important that" | Safety guardrails |
| "Remember to" | Domain-specific facts |
| "In order to" → "to" | Non-obvious examples |
| "Due to the fact that" → "because" | Precise behavioral specs |
| "Generally speaking" | Any rule with a consequence |
| Redundant restatements | Unique instructions |

### Confidence Score Decision Tree

```
Score ≥ 0.95  →  Deploy directly
Score 0.85–0.94  →  Skim the change log, then deploy
Score 0.70–0.84  →  Read the diff carefully before deploying
Score < 0.70  →  Manual review required — use the AI coach to understand changes
```

### ROI Configuration Guide

1. Open the **Config** panel in the ROI dashboard
2. Select your **model preset** (auto-fills the correct USD price)
3. Choose **currency** (USD or JPY)
4. Set **daily API calls** — this is the multiplier for all projections
5. Click **Save** — all historical data recalculates instantly

### Glossary for Non-Technical Readers

| Term | Meaning |
|------|---------|
| Token | A chunk of text ≈ ¾ of a word. Cost = tokens × price per million. |
| System prompt | The fixed instructions sent to the AI on every call. |
| Input tokens | Tokens from the system prompt + user message. You pay for all of them. |
| Compression rate | How much shorter the optimized prompt is. 40% compression = 40% fewer tokens per call. |
| SSE streaming | Results are returned over an SSE endpoint so the UI can consume optimization responses incrementally and consistently. |
| Confidence score | A 0–1 rating of how safe an optimization is to deploy without further review. |
