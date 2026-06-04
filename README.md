# Lafayette Academy — Personalization Cues

## Live demo

https://upwork-demo-99-next-js-full-stack-d.vercel.app

A Next.js + Vercel demo that turns each student's real test scores into an
AI-generated **Personalization Cue** for their instructor — the exact bridge
described in the job: a front-end wired to a database and an LLM, end to end, on
a public URL.

## What it demonstrates

- **Instructor dashboard** (`/`) — roster of students with their most recent
  SAT/ACT section scores, read live from the data store.
- **Student detail** (`/students/[id]`) — full score history per subject.
- **Generate Personalization Cue** — a 2–3 sentence coaching cue grounded in
  that student's actual scores, generated with the Vercel AI SDK.
- **Real read/write** — cues are persisted to the store and re-rendered from the
  server on reload (not a client-only stub).
- **BYOK (Bring Your Own Key)** — the visitor supplies their own provider key in
  `/settings`; the LLM call goes browser → provider directly. No key is ever
  sent to or stored on the server, and the deployed demo bills only the visitor.

## Tech stack

- Next.js (App Router) + TypeScript + Server Actions
- Tailwind CSS v4
- Vercel AI SDK (`ai`) with three pluggable providers:
  `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`
- In-memory seeded data store (stands in for Supabase/Postgres; Vercel-safe,
  requires no runtime keys)
- Playwright for behavioral acceptance tests

## BYOK — how the AI works

Open **Settings** and choose a provider, paste your API key, and pick a model:

| Provider  | Models                                                  |
| --------- | ------------------------------------------------------- |
| Anthropic | `claude-haiku-4-5` (default), `claude-sonnet-4-6`, `claude-opus-4-7` |
| OpenAI    | `gpt-4o-mini` (default), `gpt-4o`, `o1-mini`            |
| Google    | `gemini-2.0-flash` (default), `gemini-2.5-pro`          |

Your config is saved as a single JSON blob in `localStorage.byok` and never
leaves the browser except in the direct call to your chosen provider. The roster
and score history work fully **without** a key — only cue generation is gated,
with an inline hint pointing to Settings.

Tests and offline demos can use a built-in `mock` provider that returns
deterministic, grounded cues with no network call.

## Run locally

```bash
pnpm install
pnpm exec playwright install --with-deps chromium   # once, for tests
pnpm dev                                             # http://localhost:3000
```

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test     # Playwright acceptance suite (7 tests)
```

The suite covers every acceptance criterion: dashboard + scores load, student
score history, the BYOK gate (no key → disabled with hint), the happy path
(mock key → grounded cue), cue persistence across reload, settings persistence,
and mobile-width usability.

## Deploy

https://upwork-demo-99-next-js-full-stack-d.vercel.app
