# Parsing & Image Reliability Plan

Fixes for the three reliability symptoms: slow parsing, parse failures on
bot-protected sites, and recipe images breaking after parse.

Root causes (verified in code):

- **No visibility**: parse errors are emitted inside an already-open SSE stream,
  so the HTTP status is 200 and Sentry never sees them
  ([route.ts:257-264](../src/app/api/recipes/parse/route.ts)). All failures are
  `console.error` only.
- **Bot protections**: a single direct fetch with browser-like headers was the
  only fetch strategy; Cloudflare-style blocks fell through to Gemini
  `urlContext`, which the same protections usually block too. *Addressed — see
  Phase 0.*
- **Serial in-request pipeline**: scrape → Gemini → DB save → up to 5×4s image
  liveness checks → (possibly) AI hero generation + sharp + Blob upload, all
  before the response closes. Worst case exceeds `maxDuration = 60`, and since
  the recipe row is committed mid-stream the user sees an error while the
  recipe silently exists.
- **Hot-linked images**: scraped image URLs are stored verbatim and never
  downloaded. Liveness is checked once at parse time; `referrerPolicy="no-referrer"`
  on the `<img>` tags actively triggers hotlink protection on some CDNs. Images
  rot with no repair path.

Phases are ordered so each lands independently.

---

## Phase 0 — ScraperAPI fallback for bot-protected sites ✅ (implemented)

ScraperAPI was chosen from the comparison in
[SCRAPING_SERVICES.md](./SCRAPING_SERVICES.md); account created, key set as
`SCRAPERAPI_API_KEY` locally and on Vercel (free tier: 1,000 credits/month
recurring; Cloudflare/DataDome bypass costs 10 credits when triggered).

Fetch chain in [scraper.ts](../src/lib/scraper.ts):

1. **Direct fetch** — browser-like headers, 8s timeout. Free, fast, works for
   most sites.
2. **ScraperAPI** — on any direct-fetch failure (403/blocked/timeout). Handles
   proxy rotation and anti-bot bypass automatically; only successful requests
   consume credits. 35s timeout.
3. **Gemini `urlContext`** — unchanged last resort when both fetches fail or
   return no content.

Without `SCRAPERAPI_API_KEY` set, step 2 fails immediately and behavior is
identical to the previous chain.

Known tension: ScraperAPI recommends a 70s client timeout for best success
rates; we cap at 35s because the route's `maxDuration` is 60s and Gemini still
runs after the fetch. Phase 3 makes parsing asynchronous and raises
`maxDuration` — bump the ScraperAPI timeout to 70s as part of it.

---

## Phase 1 — Observability (D) ✅ (implemented)

**Goal:** every parse failure appears in Sentry, tagged by pipeline stage and
source domain, so failure modes can be quantified.

### Tasks

1. **Tag the pipeline stage.** In the parse route, track a `stage` variable
   through the flow: `scrape` → `gemini-parse` / `gemini-url-fallback` /
   `gemini-youtube` → `save` → `image-check` → `image-generate`.
2. **Capture the terminal error.** In the stream's catch block
   ([route.ts:257](../src/app/api/recipes/parse/route.ts)), add
   `Sentry.captureException(error, { tags: { stage, sourceType, sourceHost } })`
   before sending the SSE error event. `sourceHost` = `new URL(body.url).hostname`.
3. **Capture the swallowed scrape failure.** The catch at
   [route.ts:160](../src/app/api/recipes/parse/route.ts) currently
   `console.error`s and falls back to Gemini `urlContext`. Capture it with
   `stage: "scrape"` — this is the direct measure of how often bot protection
   bites. Have `extractWebPage` throw a typed error carrying the HTTP status
   so 403/429/503 (blocked) is distinguishable from timeouts and DNS failures.
   Tag which fetch tier failed (`direct` vs `scraperapi`) — this shows whether
   the free ScraperAPI tier's 1,000 credits/month suffice and how often the
   fallback rescues a parse.
4. **Capture inline hero-generation failure**
   ([route.ts:242](../src/app/api/recipes/parse/route.ts)) with
   `stage: "image-generate"`.
5. **Same treatment for the other AI routes** (`parse-image`, `generate-image`,
   `chat`) — they share the console-only blindspot.
6. **Stop leaking raw errors to the browser.** Replace the `error.message`
   passthrough with a translated generic message. The detail lives in Sentry.

### Acceptance

- Parse a bot-protected URL and a nonsense URL → both produce Sentry events
  with correct `stage` and `sourceHost` tags.
- A successful parse produces no error events.

---

## Phase 2 — Bounded, hardened fetching (C3) ✅ (implemented)

**Goal:** no single network call can hang the pipeline; the known scraper and
Gemini-response bugs are fixed.

### Tasks

1. **Drop the redirect preflight.** Delete `resolveRedirects`
   ([scraper.ts](../src/lib/scraper.ts)) — up to 5 serial HEAD requests
   that many CDNs reject anyway (now bounded by timeouts, but still wasted
   latency). Use the single GET with `redirect: "follow"` and take
   `response.url` as the resolved base URL for relative image paths.
2. **Timeout on the primary Gemini parse call:**
   `abortSignal: AbortSignal.timeout(45_000)` on `parseRecipeContent` and
   `parseRecipeFromYoutube` (the `urlContext` fallback already has one).
3. **Guard Gemini responses.** Replace the `response.text!` non-null assertions
   ([gemini.ts:238,336](../src/lib/gemini.ts) and siblings) with an explicit
   check — a safety block or `MAX_TOKENS` finish currently becomes
   `JSON.parse(undefined)` and the `SyntaxError` reaches the user. Wrap the
   `urlContext` fallback's `JSON.parse` the same way. Throw descriptive errors
   so Phase 1 tags them usefully.
4. **Fix the step-photo bug.** In `extractPageImages`
   ([scraper.ts:244-252](../src/lib/scraper.ts)), the og:image push before the
   selector loop makes `if (images.length > 0) break;` fire on the first
   selector — content images are almost never collected. Track og:image
   separately from content-selector hits so the loop actually tries selectors.
5. **Add `maxDuration` to the other AI routes** (`parse-image`,
   `generate-image`, `chat`) — they currently run on Vercel's default limit
   and can truncate mid-generation.

### Acceptance

- A URL pointing at a non-responding host exhausts the fetch chain (8s direct
  + bounded ScraperAPI attempt) with `stage: "scrape"`, well under the 60s
  ceiling.
- A page with content images but no `<article>` tag yields step photos.
- Build, lint pass; parse a handful of known-good recipe URLs end-to-end.

---

## Phase 3 — Async parsing + images to Blob (A1 + C1)

**Goal:** submitting a URL returns instantly; the entire parse (fetch → Gemini
→ images) runs in the background. Images are downloaded once, stored in
Vercel Blob, and never rot. The user can submit and walk away — the recipe
card fills in when ready.

**Mechanism decision:** the whole parse runs inside `after()` from
`next/server` — it executes after the response closes, within the same
function invocation. Chosen over a job service (Inngest / Trigger.dev /
QStash) to avoid a new vendor; the durability gap (a crash or deploy kills the
in-flight parse with no retry) is covered by a stale-detection sweep and a
manual retry button. If Sentry later shows parses dying mid-flight often, swap
the execution layer for a job service — the status machinery below carries
over unchanged.

### Design — request flow

- **Schema:** add `status` (`parsing` | `failed` | `ready`) and `parseError`
  (short reason key, not a raw message) to the `recipes` table.
- **`POST /api/recipes/parse`** validates the URL, inserts the row with
  `status: "parsing"` and a placeholder title (source hostname), schedules the
  parse in `after()`, and immediately returns `{ id }` as plain JSON. The SSE
  stream and [progress-stream.ts](../src/lib/progress-stream.ts) go away.
- **Background parse** (in `after()`): fetch chain → Gemini → update row with
  parsed content and `status: "ready"` → then the image phase below fills in
  images. On any error: `status: "failed"` + `parseError`, plus the Phase 1
  Sentry capture (the instrumentation carries over to this flow).
- **Reparse (`replaceId`)** keeps the existing content untouched until the new
  parse succeeds — only the status flips to `parsing` meanwhile, and a failure
  restores `ready` with the old content.
- **Timeouts:** raise the route's `maxDuration` to the plan's ceiling (check
  what the Vercel plan / Fluid Compute allows) since `after()` counts toward
  it, and bump the ScraperAPI timeout to the recommended 70s.

### Design — client UX

- The recipe list shows the new card immediately in a "parsing" state and
  polls the row every few seconds while `status: "parsing"` (give up after
  ~3 minutes and treat as failed).
- A failed card shows a translated reason and a **retry** button (re-submits
  with `replaceId`).
- A `ready` card with no images yet shows a placeholder until the image phase
  fills them in.
- Later, optionally: use the existing web-push setup to notify when a parse
  finishes — pairs well with the submit-and-leave flow on mobile.

### Design — durability

- **Stale sweep, lazy:** when a client polls a recipe whose `status` is
  `parsing` but whose `updatedAt` is older than the function ceiling plus
  margin, the server marks it `failed` (reason: interrupted) before
  responding. No cron needed.

### Design — image phase

Replaces today's liveness-check-then-hotlink; runs after the recipe is
`ready`, inside the same `after()` work:
  1. Collect every distinct image URL the recipe references: `images[]` plus
     each `Step.imageUrl` in `prepSteps`/`cookingSteps` (Gemini assigns step
     photos by URL — these must be remapped, not just the hero).
  2. Download candidates **in parallel**, each with its own timeout (8s) and a
     size cap (~10 MB), validating `content-type: image/*`. This subsumes the
     old serial `findFirstWorkingImage` HEAD checks.
  3. Process each successful download with sharp (reuse the resize/JPEG
     pipeline from `generateAndStoreHeroImage` — extract a shared
     `processAndStoreImage` helper in [recipe-image.ts](../src/lib/recipe-image.ts);
     no watermark for scraped images), upload to Blob.
  4. Update the recipe row: rewrite `images[]` and every `Step.imageUrl` from
     origin URL → stored URL. Drop images that failed to download.
  5. If **no** image survived and it's a fresh parse (not `replaceId`),
     generate the AI hero exactly as today — now also off the critical path.
- **Serving (decided: public):** recipe image Blobs use `access: "public"`
  and the recipe stores the Blob URL directly — CDN-cached, zero function/DB
  cost per view; the URLs are long random strings, effectively unguessable.
  Generated hero images move to the same model, retiring the authenticated
  proxy route
  ([api/recipes/[id]/image](../src/app/api/recipes/%5Bid%5D/image/route.ts))
  for recipe images.
- YouTube thumbnails go through the same download-and-store path (the
  `img.youtube.com` hotlink is just another origin URL).

### Acceptance

- `POST /api/recipes/parse` returns within ~1s; the card appears in the list
  immediately and fills in without a page reload when the parse completes.
- A failed parse shows a card with a translated reason and a working retry.
- A parse interrupted mid-flight (e.g. by a deploy) ends up `failed` with
  retry offered — never stuck in `parsing` forever.
- A reparse that fails leaves the previous recipe content intact.
- After a parse, the recipe's `images[].url` and all `Step.imageUrl` values
  point at stored copies, not origin URLs.
- Deleting/blocking the origin image after a parse does not break the recipe.
- A parse where every image download fails still yields a generated hero.

---

## Phase 4 (optional) — Backfill existing recipes

A one-off script in `scripts/` that iterates existing recipes and normalizes
them to the Phase 3 model:

- `images[].url` pointing at an external origin → download-and-store pipeline;
  origin images that are already dead fall back to hero generation.
- Existing private Blobs (generated heroes served via the proxy route) →
  re-upload as public, update the row to the direct Blob URL.

Run manually; log a summary (migrated / already-stored / dead-and-regenerated).
Once no rows reference the proxy route, delete it.

---

## Explicitly out of scope (tracked separately)

- Rate limiting on `/api/recipes/parse` (billing-abuse surface — now also
  spends ScraperAPI credits).
- SSRF hardening of URL validation (internal hosts / link-local addresses are
  currently fetchable server-side).
