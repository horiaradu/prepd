# Architecture

## Overview

Prepd is a single Next.js application deployed on Vercel. All server logic lives in Next.js API routes (Route Handlers). There is no separate backend.

```
┌─────────────────────────────────────────────┐
│                  Vercel                       │
│                                               │
│  ┌──────────────┐     ┌──────────────────┐   │
│  │  React UI     │────▶│  API Routes       │   │
│  │  (App Router) │◀────│  (Route Handlers) │   │
│  └──────────────┘     └────────┬─────────┘   │
│                                │              │
│                       ┌────────┴─────────┐   │
│                       │  Neon Postgres    │   │
│                       └──────────────────┘   │
└───────────────────────────┬───────────────────┘
                            │
              ┌─────────────┼─────────────────┐
              │             │                  │
     ┌────────▼───┐  ┌─────▼──────┐  ┌───────▼────────┐
     │ Gemini API  │  │ YouTube    │  │ Web pages       │
     │ (LLM +      │  │ transcript │  │ (cheerio scrape)│
     │  grounding)  │  │ extraction │  │                 │
     └─────────────┘  └────────────┘  └─────────────────┘
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page — tiled grid of saved/cooked recipes |
| `/recipe/[id]` | View a parsed recipe with images and cook history |
| `/parse` | Paste a URL to parse a new recipe |
| `/suggest` | Chat-style interface for recipe suggestions |
| `/login` | Google sign-in (handled by NextAuth) |

## API Routes

### `POST /api/recipes/parse`

Accepts a URL (recipe page or YouTube video). **Parsing is asynchronous:**
the route creates the recipe row and returns its id immediately; the actual
work runs in the background via `after()`. Clients poll the recipe until its
`status` leaves `parsing`. See `docs/RELIABILITY_PLAN.md` for the full
rationale.

**Request:** `{ "url": "https://youtube.com/watch?v=abc123" }`
(optional `replaceId` to reparse an existing recipe in place).

**Response (202):** `{ "id": "uuid", "sourceType": "youtube" }`.

**Guards:** URL must pass `isFetchableUrl` (SSRF — rejects private/reserved
IPs, localhost, internal TLDs); non-reparse calls are rate-limited to 20
recipes/user/hour.

**Background pipeline** (`src/lib/parse-pipeline.ts`):
1. Detect URL type (YouTube vs. web page).
2. YouTube → Gemini processes the video directly (`fileData` with the URL);
   no transcript package.
3. Web page → **fetch chain** (`src/lib/scraper.ts`): direct fetch (8s) →
   on failure, **ScraperAPI** (anti-bot proxy, 70s) → on empty/failure,
   Gemini `urlContext`. HTML parsed with `cheerio` (JSON-LD first, then
   article heuristics).
4. Send extracted content to Gemini with the recipe parsing prompt
   (see LLM_PROMPTS.md); the web path uses no `responseSchema` (it caused
   pathological latency on some articles — the prompt dictates the shape and
   `normalizeRecipe` tolerates drift). 120s timeout.
5. Save parsed content; flip `status` to `ready`.
6. **Persist images** (`src/lib/recipe-image.ts`): download every referenced
   image (hero + per-step), store in the public Blob store, rewrite
   references to the stored copies. If none survive a fresh parse, generate
   an AI hero. Failures never invalidate the already-ready recipe.

Failures set `status: failed` + `parseError` and are captured in Sentry
tagged with the pipeline stage. A crash/deploy mid-parse is detected lazily
on read (a row stuck in `parsing` past the function ceiling is marked failed,
or ready if it already has content).

### `POST /api/recipes/parse-image`

Photo (OCR) parsing — same async shape as the URL flow. Uploaded photos are
resized, stored in the **private** Blob store (served via the auth proxy),
the row is created `parsing`, and OCR runs in the background
(`src/lib/parse-image-pipeline.ts`). A JSON `{ replaceId }` body re-OCRs a
recipe's stored source photos (the failed-card retry).

Both parse routes send a push notification on completion (suppressed when the
app is focused) — see `src/lib/parse-notify.ts`.

### `POST /api/recipes/suggest`

Free-text recipe suggestions with conversational UX.

**Flow:**
1. Send user message to Gemini API with Google Search grounding enabled
2. LLM returns suggestions with recipe ideas, descriptions, and source links
3. Return the response as markdown (rendered in the chat UI)
4. If the user wants to save a suggested recipe, they can click "parse" on any returned link, which triggers the parse flow

**Request:**
```json
{ "message": "quick weeknight pasta with mushrooms" }
```

**Response:**
```json
{
  "reply": "Here are some ideas:\n\n1. **Creamy Mushroom Pasta** — ...",
  "sources": [
    { "title": "Creamy Mushroom Pasta", "url": "https://..." }
  ]
}
```

### `GET /api/recipes`

List saved recipes. Supports search via query param. Returns recipe summaries with cook count and last cooked date.

**Request:** `GET /api/recipes?q=chicken`

**Response:** Array of `RecipeSummary` (id, title, sourceUrl, images, cookCount, lastCookedAt, createdAt).

### `GET /api/recipes/[id]`

Get full recipe by ID, including images and cook history (with tweaks).

### `DELETE /api/recipes/[id]`

Delete a saved recipe.

### `POST /api/recipes/[id]/cook`

Log that a recipe was cooked, with optional tweaks.

**Request:**
```json
{ "tweaks": "used coconut milk instead of cream, added extra garlic" }
```

**Response:** The created `CookLog` entry.

### `GET /api/recipes/[id]/cook-history`

Get the full cook history for a recipe (dates + tweaks).

## Authentication

NextAuth.js with Google OAuth provider. Single authorized user (your Google email). Middleware protects all routes except `/login`.

**Environment variables:**
```
GOOGLE_CLIENT_ID=        # Google OAuth client ID
GOOGLE_CLIENT_SECRET=    # Google OAuth client secret
NEXTAUTH_SECRET=         # Random string for session encryption
NEXTAUTH_URL=            # App URL (http://localhost:3000 in dev, https://prepd-ten.vercel.app in prod)
AUTHORIZED_EMAIL=        # Your Google email — only this user can log in
```

## External Services

### Google Gemini API

- Model: `gemini-3-flash-preview` for parsing/suggestions; `gemini-2.5-flash-image` for hero-image generation
- Used for recipe parsing (JSON output), YouTube video understanding, photo OCR, and recipe suggestions (with Search grounding)
- API key stored in `GEMINI_API_KEY` env var

### YouTube

- Handled directly by Gemini: the video URL is passed as `fileData` and the model extracts the recipe with per-step timestamps. No transcript package.

### URL Scraping

- Fetch chain with an anti-bot fallback — see `POST /api/recipes/parse` above.
- `cheerio` parses HTML: JSON-LD `Recipe` structured data first (cleaner than raw HTML), falling back to article-body heuristics.
- **ScraperAPI** (`SCRAPERAPI_API_KEY`) is the fallback when a direct fetch is bot-blocked; only successful requests cost credits.

### Vercel Blob (two stores)

- **Private store** (`BLOB_READ_WRITE_TOKEN`): user-uploaded photos and inbox images, served through the authenticated `/api/recipes/[id]/image` proxy.
- **Public store** (`PUBLIC_BLOB_STORE_ID` + OIDC): recipe display images (scraped originals downloaded here, plus generated heroes), served directly from the CDN. A store's access mode can't be changed after creation, which is why there are two.

## Environment Variables Summary

```
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
AUTHORIZED_EMAIL=

# Database
DATABASE_URL=            # Neon Postgres connection string (via Vercel)

# LLM + scraping
GEMINI_API_KEY=
SCRAPERAPI_API_KEY=      # bot-protection fallback

# Blob (public recipe images)
PUBLIC_BLOB_STORE_ID=    # default BLOB_READ_WRITE_TOKEN covers the private store

# Push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```
