# Codex Session 3

- Session/thread ID: `019f6fca-6bee-7f33-9836-ae5f6f5fa65b`
- Date: 2026-07-18
- Scope: Single-URL public article import for New Material.
- Delivery commit: `60cf2c0` (`Add safe URL article import`).

## Work completed

- Added a reviewed `Import URL` flow alongside pasted text; multiple-URL imports are explicitly out of scope.
- Added server-side article extraction with Cheerio 1.0.0 and title/text preview before a job is created.
- Added SSRF and request safeguards: public HTTP(S) only, private/local host rejection, redirect revalidation, HTML-only responses, 10-second timeout, and 2 MB response cap.
- Added an educator usage-rights confirmation and editable imported text.
- Persisted source URL, domain, and access timestamp on jobs; rendered citations in Result and PDF export.
- Updated UI, API, and DB design documents. Added extraction and URL validation tests.

## Verification

- `npm test` passed: 13 tests.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed.
- `npx prisma db push` synchronized the configured Neon/PostgreSQL schema.

## Follow-up: Result stability and JLPT recovery (2026-07-18)

- Delivery commits: `4077f00` (`Stabilize result titles and recover revisions`) and `0a076ea` (`Label legacy result titles by level`).
- Moved generated titles from the shared job record to `level_versions.generated_title`, keeping imported source titles stable while level tabs are selected.
- Kept the selected result tab stable during polling, made in-progress analysis explicit, and moved regeneration to the simplified-text header.
- Made a post-draft readability revision resilient to transient Structured Outputs failures by retaining the last scored draft as a near-match.
- Re-ran the previously failed `ja_jlpt_n4n3` level `686abc23-6b35-45aa-a86d-54b8b5e4eb57`: it completed after two verification attempts with score `3.21` in its `2.0-3.5` target range.
- Ordered all Result API level arrays by the level master so tabs render low-to-high, independent of the order in which levels were selected. Delivery commit: `bd8ad49`.
- Reoriented the existing key-phrase extraction call toward grammar and sentence-pattern instruction, relabeled it as Language focus across UI/PDF/questions, and added prompt coverage. Delivery commit: `79bd5c8`.
- Replaced text-only page loading states with an accessible animated loading indicator across Result, Questions, Export, and History. Delivery commit: `c10e2c9`.
- Added a three-language teacher guide page and Guide navigation link. Delivery commit: `5a576bf`.
- Improved the teacher-copy PDF answer key with grouped question text, full correct choices, explanations, and answer-format coverage. Delivery commit: `2203cf5`.
- Fixed history reuse navigation and standardized interactive button cursors. Delivery commit: `04be594`.
- Changed New Material to start empty and moved sample materials into a localized collapsed examples section. Delivery commit: `fe2c0df`.

## Follow-up: UI principle audit implementation (2026-07-18)

- Applied the speed-neutral UI improvements identified against Figma's hierarchy, progressive-disclosure, consistency, accessibility, proximity, and alignment principles.
- Added neutral first-visit source-length guidance, a dedicated mobile navigation row, visible keyboard focus handling, reduced-motion support, clearer Result action hierarchy, and a localized Guide quick start before the detailed instructions.
- Updated `LevelLens_ui.md` with the responsive and accessibility behavior. Delivery commit: `bbed836`.

## Follow-up: Teacher workflow clarity (2026-07-18)

- Added localized explanations beside a disabled conversion action, using the existing character and level-selection validation state.
- Made persisted readability and fact-consistency outcomes immediately scannable with explicit status badges; no additional model or API work is performed.
- Expanded History metadata with level labels and status, and standardized empty/error states across History, Result, Questions, and Export.
- Updated `LevelLens_ui.md`. Delivery commit: `144da5b`.

## Follow-up: Two-week public hosting safeguards (2026-07-19)

- Added 14-day HTTP-only anonymous workspace ownership. Jobs store a SHA-256 token hash only; all job reads, History, export, and regeneration now require the matching browser token.
- Added owner-plus-IP fixed-window and daily quotas for conversion, URL import, regeneration, and PDF export. Quota records are hashed and deleted after two days.
- Added a CRON_SECRET-protected daily Vercel maintenance endpoint that cascade-deletes jobs and all derived data after 14 days.
- Updated README, `.env.example`, UI/API/DB design documents, and this session record. Delivery commit: `f6362ad`.

## Follow-up: Build Week submission documentation (2026-07-19)

- Replaced the scaffold README with an English canonical project README covering the Education use case, setup, judge testing, privacy, architecture, third-party materials, GPT-5.6/Codex collaboration, dated evidence, and the primary `/feedback` session ID.
- Added linked Spanish and Japanese README translations, English judge testing instructions, a submission checklist, a sub-three-minute English demo-video script, and an MIT license.
- Kept deployment and YouTube submission links as explicit pre-submission checklist items rather than claiming they are complete. Delivery commit: `0d9a91f`.
