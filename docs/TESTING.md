# Judge Testing Instructions

## Live Demo

Before submission, add the deployed URL to the Devpost project page. The live demo does not require an account or a test login.

## Local Setup

1. Use Node.js 20 or later and PostgreSQL/Neon.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`.
3. Run `npm install`, `npx prisma generate`, `npx prisma db push`, and `npm run dev`.
4. Open `http://localhost:3000`.

## Core Test Flow

1. Open **New material** and paste at least 200 characters of an original English, Spanish, or Japanese teaching text. Original sample texts are available under the collapsed Example materials section.
2. Choose one or more target levels and select **Convert material**.
3. On Result, keep a level selected while its progressive status advances. Compare the original and simplified text, then inspect Readability, Fact consistency, Language focus, and Questions.
4. Open **Questions** to review four-choice questions and **Export** to download a student or teacher PDF worksheet.
5. Open **History** to reopen or reuse material created in the same browser.

## Expected Behavior

- A result can be in range, near match, or failed without blocking sibling levels.
- A near-match or failed level exposes **Regenerate level**.
- Imported URL material requires an educator-use confirmation and preserves source attribution.
- History and results are available only in the browser that created the material; this is intentional anonymous-workspace privacy behavior.

## Production Configuration

Set `OPENAI_API_KEY`, `DATABASE_URL`, `OPENAI_MODEL`, and `CRON_SECRET` in Vercel. The included `vercel.json` calls the protected retention cleanup endpoint once daily. Do not expose any of these values to the browser.

## Automated Checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```
