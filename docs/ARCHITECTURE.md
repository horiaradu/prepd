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
| `/` | Landing / recipe list (saved recipes) |
| `/recipe/[id]` | View a parsed recipe |
| `/parse` | Paste a URL to parse a new recipe |
| `/suggest` | Chat-style interface for recipe suggestions |
| `/login` | Google sign-in (handled by NextAuth) |

## API Routes

### `POST /api/recipes/parse`

Accepts a URL (recipe page or YouTube video). Returns a structured recipe.

**Flow:**
1. Detect URL type (YouTube vs. regular page)
2. If YouTube: extract transcript using `youtube-transcript` package
3. If web page: fetch HTML, extract main content with `cheerio`
4. Send extracted text to Gemini API with the recipe parsing prompt (see LLM_PROMPTS.md)
5. Parse the LLM JSON response
6. Save to database
7. Return the structured recipe

**Request:**
```json
{ "url": "https://youtube.com/watch?v=abc123" }
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Chicken Tikka Masala",
  "sourceUrl": "https://youtube.com/watch?v=abc123",
  "sourceType": "youtube",
  "servings": 4,
  "ingredients": [
    { "name": "chicken breast", "quantity": 500, "unit": "g" },
    { "name": "yogurt", "quantity": 200, "unit": "ml" }
  ],
  "prepSteps": [
    {
      "instruction": "Cut chicken into 3cm cubes",
      "ingredients": [
        { "name": "chicken breast", "quantity": 500, "unit": "g" }
      ]
    }
  ],
  "cookingSteps": [
    {
      "instruction": "Heat oil in a large pan over medium heat",
      "ingredients": [
        { "name": "vegetable oil", "quantity": 30, "unit": "ml" }
      ]
    }
  ]
}
```

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

List saved recipes. Supports search via query param.

**Request:** `GET /api/recipes?q=chicken`

**Response:** Array of recipe summaries (id, title, sourceUrl, createdAt).

### `GET /api/recipes/[id]`

Get full recipe by ID.

### `DELETE /api/recipes/[id]`

Delete a saved recipe.

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

- Model: `gemini-2.5-flash` (stable, free tier)
- Used for recipe parsing (structured JSON output) and recipe suggestions (with Search grounding)
- Free tier — more than enough for personal use
- API key stored in `GEMINI_API_KEY` env var

### YouTube Transcripts

- `youtube-transcript` npm package extracts auto-generated or manual captions
- No API key needed — scrapes the transcript from the video page
- Falls back to video description if no transcript is available

### URL Scraping

- `cheerio` parses recipe page HTML
- Extract the main content (look for `<script type="application/ld+json">` with Recipe schema first — many recipe sites use structured data, which is much cleaner than raw HTML)
- Fall back to extracting article body text if no structured data found

## Environment Variables Summary

```
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
AUTHORIZED_EMAIL=

# Database
POSTGRES_URL=            # Neon Postgres connection string (via Vercel)

# LLM
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_NAME=Prepd
```
