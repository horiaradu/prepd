# Implementation Plan

Phased approach — each phase results in something usable.

## Phase 1: Parse a recipe from a URL (core MVP)

Get the single most valuable feature working end-to-end with no auth, no database.

### Tasks

- [x] Scaffold Next.js project with App Router, Tailwind CSS, TypeScript
- [x] Create a simple page with a URL input field and a "Parse" button
- [x] Implement URL content extraction:
  - [x] YouTube URL detection + transcript extraction (`youtube-transcript`)
  - [x] Web page fetching + content extraction (`cheerio`) — check for JSON-LD Recipe schema first, fall back to body text
- [x] Set up Gemini API client (`@google/generative-ai` SDK)
- [x] Implement `POST /api/recipes/parse` route:
  - [x] Extract content from URL
  - [x] Send to Gemini with recipe parsing prompt
  - [x] Return structured JSON
- [x] Create recipe display component:
  - [x] Title and servings
  - [x] Ingredients list (with metric quantities)
  - [x] Prep steps section (each step shows its ingredients)
  - [x] Cooking steps section (each step shows its ingredients)
- [ ] Manual testing with 5-10 diverse recipes (blog posts, YouTube videos, different cuisines)
- [ ] Iterate on the parsing prompt based on results

**Status:** Complete. Deployed to Vercel. Testing and prompt iteration ongoing.

## Phase 2: Database + saved recipes

Persist recipes so they aren't lost on refresh.

### Tasks

- [x] Set up Neon Postgres (via Vercel marketplace)
- [x] Set up Drizzle ORM with schema from DATA_MODEL.md
- [x] Run initial migration
- [x] Update parse route to save recipes to the database after parsing
- [x] Extract and store images from web page recipes during parsing (JSON-LD `image`, `og:image`, content area `<img>` tags)
- [x] Create `GET /api/recipes` route — list saved recipes (include cook count + last cooked date)
- [x] Create `GET /api/recipes/[id]` route — get single recipe with cook history
- [x] Create `DELETE /api/recipes/[id]` route
- [x] Build home page (`/`) as a tiled grid of previously cooked/saved recipes:
  - [x] Each tile shows the recipe's hero image (first from `images`), title, cook count
  - [x] Recipes sorted by last cooked date (most recent first), then by creation date
  - [x] URL input for parsing new recipes stays at the top
  - [ ] Search/filter by title
- [x] Build recipe detail page (`/recipe/[id]`):
  - [x] Gemini assigns extracted images to relevant steps (shown inline)
  - [x] Show cook history with tweaks
  - [x] "I cooked this" button with optional tweaks text field

**Status:** Complete (except search/filter).

## Phase 2b: Cook log + tweaks

Track cooking history and personal adjustments.

### Tasks

- [x] Create `cook_log` table (migration)
- [x] Create `POST /api/recipes/[id]/cook` route — log a cook with optional tweaks
- [x] Create `GET /api/recipes/[id]/cook-history` route — get cook log for a recipe
- [x] Add "I cooked this" button to recipe detail page
- [x] Show tweaks input (free text) when logging a cook
- [x] Display cook history on recipe detail page (date + tweaks for each cook)
- [x] Update home page tiles to show cook count badge

**Status:** Complete. Will be reworked in Phase 4 — "I cooked this" becomes a conversation with the LLM that applies tweaks directly to the recipe instead of storing them as comments.

## Phase 2c: Recipe display enhancements

### Tasks

- [x] Servings scaler — number input adjusts all ingredient quantities proportionally
- [x] YouTube video timestamp links — each step links to the relevant moment in the video
- [x] YouTube thumbnail on home tiles

**Status:** Complete.

## Phase 3: Authentication

Multi-user support with Google OAuth.

### Tasks

- [x] Set up NextAuth.js with Google provider + DrizzleAdapter
- [x] Create Google OAuth credentials (Google Cloud Console)
- [x] Add auth middleware — protect all routes except `/login`
- [x] Add user_id to recipes table, associate recipes with the logged-in user
- [x] Add login/logout UI
- [x] Open to any Google account (no email restriction)

**Status:** Complete.

## Phase 4: Recipe conversations

LLM-powered editing and post-cook refinement. Both "fix this recipe" and "I cooked this" happen through the same conversation interface on the recipe detail page.

### Recipe chat

A conversation panel on the recipe detail page. You can:
- Correct parsing mistakes ("garlic should be 4 cloves not 2")
- Refine steps ("add a step to toast the spices first")
- Apply post-cook tweaks ("coconut milk worked better than cream, and it needed 10 more minutes")

The LLM receives the current recipe JSON + your message, returns an updated recipe, and the new version is saved. The cook date is logged when you indicate you've cooked it.

### Tasks

- [x] Add recipe conversation UI to detail page (message input + message history)
- [x] Implement `POST /api/recipes/[id]/chat` route:
  - [x] Send current recipe JSON + user message to Gemini
  - [x] Gemini returns updated recipe JSON
  - [x] Save updated recipe to DB
  - [x] Log cook date if the message indicates the user cooked it
- [x] Store original parsed recipe for "view original" comparison
- [x] Show conversation history on the recipe (persisted)
- [x] Rework "I cooked this" to open the conversation with a prompt
- [x] Remove old tweaks-as-comments UI (cook_log.tweaks → conversation messages)

**Status:** Complete.

## Phase 4b: Recipe suggestions (chat)

Conversational recipe discovery. Leverages cooking history for personalized suggestions.

### Tasks

- [x] Create `/suggest` page with a chat-style UI (message input, scrollable message list)
- [x] Implement `POST /api/recipes/suggest` route:
  - [x] Send user message to Gemini with Search grounding enabled
  - [x] Include saved recipe titles + cook history as context
  - [x] Return markdown response with source links
- [x] Render markdown responses in the chat UI
- [x] Add "Parse this recipe" action on any URL that appears in suggestions
- [x] Add conversation history (in-memory per session is fine — no need to persist chats)
- [x] Generate full recipes from LLM's "My own ideas" section
- [x] Fix URL parsing: resolve Google redirect URLs before scraping, fall back to Gemini URL context
- [x] Append grounding source URLs when model omits them from response text

**Status:** Complete.

## Phase 5: Polish

### Tasks

- [ ] Responsive design (works on phone — useful in the kitchen)
- [ ] Loading states and error handling for all async operations
- [ ] Re-parse action on saved recipes (useful when prompts improve)
- [ ] Search/filter recipes by title on home page
- [ ] Visual cook timer indicators for steps that mention time
- [ ] Print-friendly layout
- [x] Deploy to Vercel with production env vars
- [ ] Custom domain (optional)

## Dependencies

```bash
# Core
npx create-next-app@latest prepd --typescript --tailwind --eslint --app --src-dir --use-npm

# LLM
npm install @google/generative-ai

# Content extraction
npm install youtube-transcript cheerio

# Auth
npm install next-auth @auth/drizzle-adapter

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

## External accounts (all set up)

1. **Google Cloud Console** — project `prepd`:
   - OAuth 2.0 credentials (for login)
   - Gemini API key (for LLM)
2. **Vercel** — app deployed at `prepd-ten.vercel.app`, Neon Postgres provisioned
3. **GitHub** — private repo `horiaradu/prepd`
