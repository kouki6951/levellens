# LevelLens

LevelLens turns one English, Spanish, or Japanese teaching text into multiple reading-level versions. Each version is checked with deterministic readability scoring, fact consistency review, language-focus notes, and comprehension questions.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Neon/PostgreSQL connection string. |
| `OPENAI_API_KEY` | Yes | Server-side key for Structured Outputs calls. |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6`. |
| `OPENAI_TIMEOUT_MS` | No | OpenAI request timeout in milliseconds. |
| `MAX_VERIFY_ATTEMPTS` | No | Readability verification loop limit; defaults to `3`. |
| `CRON_SECRET` | Production | Long random secret used by the Vercel retention cron. |

## Privacy and public-hosting safeguards

- No account is required. The browser receives a 14-day HTTP-only anonymous owner cookie when importing or creating material. The database stores only a SHA-256 hash; jobs, History, results, question regeneration, and PDF export require the matching browser cookie.
- Existing jobs created before this safeguard have no owner hash and are intentionally unavailable through the protected APIs.
- Conversion, URL import, regeneration, and PDF export use owner-plus-IP rate limits with both short windows and daily quotas. Rate-limit subjects are SHA-256 hashes.
- `vercel.json` invokes `GET /api/maintenance/purge` daily at 03:00 UTC. With `CRON_SECRET` configured, the route deletes jobs older than 14 days and rate-limit records older than 2 days. Cascade deletion removes derived level data.
- URL import accepts one public HTML article only and applies SSRF, redirect, response-size, and timeout safeguards.

## Architecture

- `src/lib/readability`: deterministic EN/ES/JA scorers.
- `src/lib/llm`: Structured Outputs client and prompt builders.
- `src/lib/pipeline.ts`: parallel per-level conversion and verification pipeline.
- `src/app/api`: job, import, export, maintenance, ownership, and quota-protected routes.
- `prisma/schema.prisma`: PostgreSQL data model.

## Verification

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## OpenAI and Codex use

GPT-5.6 is called only from server-side pipeline steps through the OpenAI SDK and JSON Schema Structured Outputs. Codex was used to scaffold the project, implement deterministic scoring and pipeline behavior, improve UI, add the safe URL import, and add public-hosting safeguards. Session records are in `docs/Codex_session_1.md` through `docs/Codex_session_3.md`.

## Third-party libraries and assets

Third-party packages are listed in `package.json`, including Prisma, OpenAI SDK, `text-readability`, `franc`, Cheerio, and `@react-pdf/renderer`. The LevelLens logo assets were generated with ChatGPT and are stored under `public/images/`.
