# Prepd

A personal recipe organizer that takes messy recipe links and YouTube videos and turns them into clean, structured, metric-system recipes with proper prep-first ordering.

## What it does

1. **Parse recipes from URLs** — Paste a recipe blog link or YouTube video URL. Prepd extracts the recipe, converts quantities to metric, and presents it as:
   - A clear ingredient list with metric quantities
   - Preparation steps first (chopping, slicing, marinating, etc.)
   - Cooking steps second, each listing the ingredients and quantities involved in that step

2. **Parse recipes from photos** — Snap a photo of a cookbook page, handwritten recipe, or screenshot. The image is resized in the browser, uploaded once via multipart, stored privately in Vercel Blob, and parsed with Gemini vision. The original photo doubles as the recipe's hero image, served through an authenticated proxy.

3. **Suggest recipes** — Ask in free text ("quick weeknight pasta") and get suggestions, either from your saved recipes or generated with web search results and source links. Items in saved-collection mode link directly to the recipe page; web suggestions cite their sources via Gemini grounding metadata.

4. **Generate hero images with AI** — Any recipe without a photo can have one generated on-demand with Gemini 2.5 Flash Image. Generated images are watermarked "Generated with AI" and stored in private Blob storage. Click again to regenerate.

5. **Refine with chat** — Per-recipe chat to tweak ingredients, swap techniques, or scale steps, with a one-click view of the original parsed version.

6. **Save & browse** — All parsed recipes are saved and searchable.

## Tech stack

- **Framework:** Next.js (App Router, Turbopack)
- **Auth:** NextAuth.js with Google OAuth
- **Database:** Neon Postgres + Drizzle ORM
- **Blob storage:** Vercel Blob — public store for recipe display images, private store (auth proxy) for user-uploaded photos
- **LLM:** Google Gemini API
  - `gemini-3-flash-preview` for parsing, YouTube video understanding, photo OCR, suggestions, and chat (with Google Search grounding for web suggestions)
  - `gemini-2.5-flash-image` for generated hero images
- **Image processing:** `sharp` (resize, EXIF rotate, JPEG re-encode, SVG watermark composite)
- **URL scraping:** `cheerio`, with ScraperAPI as an anti-bot fallback
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill in env vars (see docs/ARCHITECTURE.md for details)
npm run dev
```

## Documentation

- [Setup Guide](docs/SETUP.md) — accounts, API keys, and configuration (do this first)
- [Architecture](docs/ARCHITECTURE.md) — system design, API routes, external services
- [Data Model](docs/DATA_MODEL.md) — database schema
- [LLM Prompts](docs/LLM_PROMPTS.md) — prompt design for recipe parsing and suggestions
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — phased build plan
