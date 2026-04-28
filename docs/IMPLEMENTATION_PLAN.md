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

**Status:** Core implementation complete. Deployed to Vercel. Testing and prompt iteration pending.

## Phase 2: Database + saved recipes

Persist recipes so they aren't lost on refresh.

### Tasks

- [ ] Set up Neon Postgres (via Vercel marketplace)
- [ ] Set up Drizzle ORM with schema from DATA_MODEL.md
- [ ] Run initial migration
- [ ] Update parse route to save recipes to the database after parsing
- [ ] Extract and store images from web page recipes during parsing (scrape `<img>` tags from recipe content area, JSON-LD `image` field)
- [ ] Create `GET /api/recipes` route — list saved recipes (include cook count + last cooked date)
- [ ] Create `GET /api/recipes/[id]` route — get single recipe with cook history
- [ ] Create `DELETE /api/recipes/[id]` route
- [ ] Build home page (`/`) as a tiled grid of previously cooked/saved recipes:
  - [ ] Each tile shows the recipe's hero image (first from `images`), title, cook count
  - [ ] Recipes sorted by last cooked date (most recent first), then by creation date
  - [ ] URL input for parsing new recipes stays at the top
  - [ ] Search/filter by title
- [ ] Build recipe detail page (`/recipe/[id]`):
  - [ ] Show recipe images (hero image + any additional photos from source)
  - [ ] Show cook history with tweaks
  - [ ] "I cooked this" button with optional tweaks text field

**Done when:** Parsed recipes persist, the home page shows a visual tile grid of recipes, and you can browse, search, and delete them.

## Phase 2b: Cook log + tweaks

Track cooking history and personal adjustments.

### Tasks

- [ ] Create `cook_log` table (migration)
- [ ] Create `POST /api/recipes/[id]/cook` route — log a cook with optional tweaks
- [ ] Create `GET /api/recipes/[id]/cook-history` route — get cook log for a recipe
- [ ] Add "I cooked this" button to recipe detail page
- [ ] Show tweaks input (free text) when logging a cook
- [ ] Display cook history on recipe detail page (date + tweaks for each cook)
- [ ] Update home page tiles to show cook count badge

**Done when:** You can mark recipes as cooked, add tweaks, and see your cooking history per recipe.

## Phase 3: Authentication

Lock it down to just you.

### Tasks

- [x] Set up NextAuth.js with Google provider
- [x] Create Google OAuth credentials (Google Cloud Console)
- [x] Add auth middleware — protect all routes except `/login`
- [x] Add `AUTHORIZED_EMAIL` check — reject logins from other Google accounts
- [ ] Add user_id to recipes table, associate recipes with the logged-in user
- [x] Add login/logout UI

**Status:** Auth guard complete. user_id association deferred to Phase 2 (requires database).

**Done when:** Only your Google account can access the app.

## Phase 4: Recipe suggestions (chat)

The conversational recipe discovery feature. Leverages cooking history and tweaks for personalized suggestions.

### Tasks

- [ ] Create `/suggest` page with a chat-style UI (message input, scrollable message list)
- [ ] Implement `POST /api/recipes/suggest` route:
  - [ ] Send user message to Gemini with Search grounding enabled
  - [ ] Include saved recipe titles + cook history as context
  - [ ] Include tweaks history so the LLM knows user preferences (e.g. "when you made Chicken Tikka Masala, you swapped cream for coconut milk and added extra garlic")
  - [ ] Return markdown response with source links
- [ ] Render markdown responses in the chat UI
- [ ] When suggesting a previously cooked recipe, show past tweaks inline (e.g. "You've made this 3 times. Last time you noted: used coconut milk instead of cream")
- [ ] Add "Parse this recipe" action on any URL that appears in suggestions
- [ ] Add conversation history (in-memory per session is fine — no need to persist chats)

**Done when:** You can ask for recipe ideas, get suggestions that reference your cooking history and tweaks, and parse any suggested recipe directly.

## Phase 5: Polish

### Tasks

- [ ] Responsive design (works on phone — useful in the kitchen)
- [ ] Loading states and error handling for all async operations
- [ ] Re-parse action on saved recipes (useful when prompts improve)
- [ ] Edit recipe manually (fix LLM mistakes)
- [ ] Recipe presentation improvements:
  - [ ] Hero image at top of recipe detail page
  - [ ] Step photos inline where available (matched from source page images)
  - [ ] Visual cook timer indicators for steps that mention time
  - [ ] Print-friendly layout
- [x] Deploy to Vercel with production env vars
- [ ] Custom domain (optional)

## Dependencies

```bash
# Core (installed)
npx create-next-app@latest prepd --typescript --tailwind --eslint --app --src-dir --use-npm

# LLM (installed)
npm install @google/generative-ai

# Content extraction (installed)
npm install youtube-transcript cheerio

# Auth (installed)
npm install next-auth

# Database (not yet installed)
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

## External accounts (all set up)

1. **Google Cloud Console** — project `prepd`:
   - OAuth 2.0 credentials (for login)
   - Gemini API key (for LLM)
2. **Vercel** — app deployed at `prepd-ten.vercel.app`, Neon Postgres provisioned
3. **GitHub** — private repo `horiaradu/prepd`
