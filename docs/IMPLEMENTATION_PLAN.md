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
- [ ] Create `GET /api/recipes` route — list saved recipes
- [ ] Create `GET /api/recipes/[id]` route — get single recipe
- [ ] Create `DELETE /api/recipes/[id]` route
- [ ] Build recipe list page (`/`) showing saved recipes with search
- [ ] Build recipe detail page (`/recipe/[id]`)

**Done when:** Parsed recipes persist, you can browse them, search by title, and delete ones you don't want.

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

The conversational recipe discovery feature.

### Tasks

- [ ] Create `/suggest` page with a chat-style UI (message input, scrollable message list)
- [ ] Implement `POST /api/recipes/suggest` route:
  - [ ] Send user message to Gemini with Search grounding enabled
  - [ ] Include saved recipe titles as context
  - [ ] Return markdown response with source links
- [ ] Render markdown responses in the chat UI
- [ ] Add "Parse this recipe" action on any URL that appears in suggestions
- [ ] Add conversation history (in-memory per session is fine — no need to persist chats)

**Done when:** You can ask for recipe ideas, get suggestions with links, and parse any suggested recipe directly.

## Phase 5: Polish

### Tasks

- [ ] Responsive design (works on phone — useful in the kitchen)
- [ ] Loading states and error handling for all async operations
- [ ] Re-parse action on saved recipes (useful when prompts improve)
- [ ] Edit recipe manually (fix LLM mistakes)
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
