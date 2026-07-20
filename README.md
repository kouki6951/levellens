# LevelLens

**One teaching material, every reader.**

English | [Español](README.es.md) | [日本語](README.ja.md)

LevelLens is an Education project for OpenAI Build Week 2026. It helps teachers turn one English, Spanish, or Japanese teaching text into multiple reading-level versions while preserving an auditable quality signal: deterministic readability scoring, retry-based level verification, fact-consistency review, language-focus explanations, and four-choice comprehension questions.

## Why LevelLens

Teachers need materials that are accessible to students with different reading levels, but a single LLM rewrite does not prove that a version actually reached its target level. LevelLens closes that gap:

1. GPT-5.6 creates a level-specific draft.
2. A server-side deterministic scorer measures it.
3. If the score is outside the target range, the scorer's numeric feedback drives up to three revisions.
4. The final result shows the score, target, verification attempts, fact-consistency status, language focus, and questions.

The product supports English (FKGL), Spanish (Fernández-Huerta), and Japanese (a composite elementary-grade heuristic using kanji grade deviation and sentence length).

## Features

- Paste text or import one public HTML article URL with source attribution.
- Generate one to four target levels in parallel.
- Compare original and simplified material side by side while work progresses.
- Deterministic scoring and near-match recovery instead of LLM self-grading.
- Fact-consistency counts and inspectable findings.
- Grammar- and sentence-pattern-oriented Language focus with contextual glosses.
- Four-choice comprehension questions and teacher/student PDF worksheets.
- Three interface locales: English, Spanish, and Japanese.
- Anonymous 14-day workspaces, rate limits, and automatic retention cleanup for public hosting.

## Demo and Testing

- Live demo: set the deployed URL in the Devpost submission before judging.
- Judge instructions: [docs/TESTING.md](docs/TESTING.md)
- Submission checklist: [docs/HACKATHON_SUBMISSION.md](docs/HACKATHON_SUBMISSION.md)
- Under-three-minute demo script: [docs/DEMO_VIDEO_SCRIPT.md](docs/DEMO_VIDEO_SCRIPT.md)

## Local Setup

Prerequisites: Node.js 20+, PostgreSQL/Neon, and an OpenAI API key.

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

### Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Neon/PostgreSQL connection string. |
| `OPENAI_API_KEY` | Yes | Server-only OpenAI API key. |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6`. |
| `OPENAI_TIMEOUT_MS` | No | OpenAI request timeout in milliseconds. |
| `PIPELINE_STALL_TIMEOUT_MS` | No | No-progress timeout in milliseconds before an abandoned background job is marked failed; defaults to `180000`. |
| `MAX_VERIFY_ATTEMPTS` | No | Readability verification limit; defaults to `3`. |
| `CRON_SECRET` | Production | Long random secret for the Vercel retention cron. |

On Node.js server startup, LevelLens validates `DATABASE_URL` and `OPENAI_API_KEY`. In Vercel production it also requires `CRON_SECRET`; values are never included in validation errors.

### Verification

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Architecture

- `src/lib/readability`: deterministic EN, ES, and JA scoring implementations.
- `src/lib/llm`: OpenAI Structured Outputs wrapper and pure prompt builders.
- `src/lib/pipeline.ts`: parallel per-level conversion, scoring, revision, fact check, language-focus extraction, and question generation.
- `src/app/api`: protected job, import, export, regeneration, and maintenance routes.
- `prisma/schema.prisma`: PostgreSQL job, result, ownership, and rate-limit persistence.

## How We Collaborated with Codex and GPT-5.6

This project was built and meaningfully extended during the OpenAI Build Week submission period. Dated commits record the implementation progression from the initial scaffold through the Japanese scorer, PDF workflow, UI refinement, safe URL import, and public-hosting safeguards.

| Area | Codex contribution | Product or engineering decision |
|---|---|---|
| Core pipeline | Scaffolded the Next.js/Prisma application, structured pipeline, API routes, and tests. | Keep deterministic scoring outside the LLM so a target level is measurable. |
| Language support | Implemented EN/ES deterministic formulas and a JA composite scorer with fixtures. | Use language-specific metrics rather than a single generic readability estimate. |
| GPT-5.6 integration | Built Structured Outputs schemas and isolated prompt builders for rewrite, fact check, language focus, and questions. | Feed numeric scorer feedback to revisions; never ask the model to grade itself. |
| Teacher workflow | Iterated on result comparison, progressive status, multilingual UI, questions, export, and history. | Keep the interface focused on teachers' review and classroom handoff. |
| Public demo hardening | Added safe single-URL import, anonymous workspaces, quotas, and 14-day retention. | Avoid account friction while preventing cross-user history access and limiting API-cost exposure. |
| Submission demo | Produced the English demo's edit plan, narration, captions, timing checks, and compliant screen selection. | Use only original LevelLens sample material and avoid third-party media or background music. |

The primary Codex `/feedback` session/thread ID is:

`019f6fca-6bee-7f33-9836-ae5f6f5fa65b`

Detailed session evidence is retained in [docs/Codex_session_1.md](docs/Codex_session_1.md), [docs/Codex_session_2.md](docs/Codex_session_2.md), and [docs/Codex_session_3.md](docs/Codex_session_3.md). GPT-5.6 is used server-side through the OpenAI SDK and JSON Schema Structured Outputs; no API key is exposed to the browser.

## Privacy and Public Hosting

- A 14-day HTTP-only anonymous owner cookie is issued when a visitor imports or creates material. The database stores only a SHA-256 hash.
- History, results, exports, and regeneration require the matching cookie. Job links are not share links.
- Conversion, import, regeneration, and export are rate-limited by hashed owner and IP subjects.
- `vercel.json` schedules protected cleanup daily at 03:00 UTC. With `CRON_SECRET` configured, jobs older than 14 days and derived data are deleted.

### Production Rate Limits

Rate limits apply independently to the hashed anonymous workspace token and forwarded IP address; exceeding either limit returns `429 RATE_LIMITED` with `Retry-After`. They are enabled when `NODE_ENV=production` (including Vercel Production and Preview deployments). Local `npm run dev` intentionally bypasses persistent quotas so teachers and judges can repeat smoke tests without being locked out.

| Route | Short window | Daily limit |
| --- | --- | --- |
| Language detection | 300 requests / 5 minutes | 5,000 requests |
| Conversion | 2 requests / 10 minutes | 8 requests |
| URL import | 5 requests / 10 minutes | 20 requests |
| Level or question regeneration | 4 requests / 10 minutes | 20 requests |
| PDF export | 8 requests / 10 minutes | 30 requests |

## Third-Party Software and Assets

- Dependencies and their licenses are listed in `package.json` and `package-lock.json`; notable libraries include Prisma, the OpenAI SDK, Cheerio, `franc`, `text-readability`, and `@react-pdf/renderer`.
- The LevelLens logo in `public/images/` was generated with ChatGPT for this project. It is not a third-party brand asset.
- Sample teaching materials are original project text. Imported articles remain the educator's responsibility; the UI requires a teaching-use confirmation and retains attribution.

## License

This repository is available under the [MIT License](LICENSE).
