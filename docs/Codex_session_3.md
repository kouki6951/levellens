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

## Follow-up: Pasted-material source validation repair (2026-07-19)

- Fixed `POST /api/simplify` rejecting pasted material as `URL_INVALID` when the browser serialized its absent citation as `source: null`.
- The client now omits absent citations, and the API accepts `null` as backward-compatible no-citation input. Added validation coverage. Delivery commit: `f8f6fe4`.

## Follow-up: Background pipeline timeout recovery (2026-07-19)

- Diagnosed a production-style job where one Japanese level completed but two remained in `verifying` after the serverless request stopped: the `waitUntil` task was still bounded by the route's prior 60-second function duration.
- Raised conversion and per-level regeneration route duration requests to 300 seconds, without reducing verification attempts or quality checks.
- Added no-progress recovery: after 180 seconds without a job event, the status endpoint records `job_stalled`, marks active levels failed, and finalizes the job as `failed` or `partially_failed`. The UI then stops polling and offers normal level regeneration.
- Added unit coverage for the inactivity boundary. Delivery commit: `64123ed`.

## Follow-up: Coding guideline hardening without workflow changes (2026-07-19)

- Reviewed the repository against `docs/nextjs-coding-guidelines.md` and applied only changes that preserve normal UI, API success responses, prompts, and pipeline behavior.
- Scoped stalled-job recovery to the anonymous owner token before it can mutate a job, preventing a caller who knows another job ID from triggering its terminal transition.
- Marked database, pipeline, article-import, ownership/rate-limit, background, and OpenAI client modules as server-only. Vitest uses a test-only alias so this build-time guard does not change test execution.
- Added safe handling for malformed language-detection JSON and invalid UUID route parameters; valid requests retain their existing behavior and responses.
- Delivery commit: `e2fd468`.

## Follow-up: API validation, structured errors, and URL DNS pinning (2026-07-19)

- Added complete runtime validation for PDF export requests: UUID, 1-4 unique level codes, supported locale, and optional boolean include flags.
- Converted unexpected PDF export and question-regeneration failures to the existing structured `INTERNAL_ERROR` / `LLM_ERROR` API responses.
- Replaced the article importer's hostname-based global fetch with a Node standard-library request whose DNS lookup is pinned to the validated public IP for each redirect, preventing DNS rebinding after SSRF validation.
- Added export-validation coverage. Delivery commit: `6d749c6`.

## Follow-up: Submission-focused route resilience and headers (2026-07-19)

- Added a shared unexpected-route error helper and applied it to all API routes so database, external-service, and rendering failures produce the documented structured error response without logging request content.
- Added generous anonymous owner-plus-IP rate limits to language detection; its response now establishes the same HTTP-only workspace cookie used by the rest of the application.
- Added Node startup environment validation and tests for required production configuration without exposing secret values.
- Added application-wide CSP, anti-framing, MIME-sniffing, referrer, and permissions headers.
- Delivery commit: `11d13a1`.

## Follow-up: URL import DNS pinning compatibility repair (2026-07-19)

- Fixed the Node DNS `lookup` callback used for pinned article imports: Node requests addresses with `all: true`, so the callback now returns the required address-array shape.
- Prefer validated IPv4 addresses when available because local and serverless environments can lack IPv6 egress; retain IPv6 as a fallback.
- Verified a pinned TLS request to `news.yahoo.co.jp` returns `200 text/html`; added IPv4-preference unit coverage. Delivery commit: `acbdfca`.

## Follow-up: Local rate-limit testing recovery (2026-07-19)

- Disabled persistent rate-limit accounting only when `NODE_ENV !== production`, so repeated local development checks do not lock the browser out after debugging requests.
- Production and Vercel preview deployments retain owner-plus-IP quotas. Added coverage for the local-development bypass. Delivery commit: `bf167e3`.

## Follow-up: Rate-limit documentation (2026-07-19)

- Expanded the English README with exact production rate-limit windows, 429 behavior, owner-plus-IP enforcement, and the intentional local-development bypass for repeatable smoke tests. Delivery commit: `a932bb1`.

## Follow-up: PDF preview CSP compatibility (2026-07-19)

- Allowed `wasm-unsafe-eval` in the otherwise restrictive CSP because `@react-pdf/renderer` initializes a WebAssembly module for the in-browser PDF preview.
- JavaScript `unsafe-eval` remains disallowed. Delivery commit: `13ab5e1`.

## Follow-up: PDF preview blob-frame CSP compatibility (2026-07-19)

- Allowed `blob:` only for `frame-src` and `worker-src`, which is required by the `PDFViewer` iframe used for the in-browser preview.
- Kept `frame-ancestors 'none'`, `object-src 'none'`, and JavaScript `unsafe-eval` disabled. Delivery commit: pending.
