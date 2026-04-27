# Prepd

A personal recipe organizer that takes messy recipe links and YouTube videos and turns them into clean, structured, metric-system recipes with proper prep-first ordering.

## What it does

1. **Parse recipes from URLs** — Paste a recipe blog link or YouTube video URL. Prepd extracts the recipe, converts quantities to metric, and presents it as:
   - A clear ingredient list with metric quantities
   - Preparation steps first (chopping, slicing, marinating, etc.)
   - Cooking steps second, each listing the ingredients and quantities involved in that step

2. **Suggest recipes** — Ask in free text ("quick weeknight pasta") and get suggestions, either from your saved recipes or generated with web search results and source links.

3. **Save & browse** — All parsed recipes are saved and searchable.

## Tech stack

- **Framework:** Next.js (App Router)
- **Auth:** NextAuth.js with Google OAuth
- **Database:** Vercel Postgres
- **LLM:** Google Gemini API (free tier, with Google Search grounding for suggestions)
- **YouTube transcripts:** `youtube-transcript` npm package
- **URL scraping:** `cheerio`
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
