# Implementation Plan

Phased approach — each phase results in something usable.

## Phase 1: Parse a recipe from a URL (core MVP)

Get the single most valuable feature working end-to-end with no auth, no database.

### Tasks

- [ ] Scaffold Next.js project with App Router, Tailwind CSS, TypeScript
- [ ] Create a simple page with a URL input field and a "Parse" button
- [ ] Implement URL content extraction:
  - [ ] YouTube URL detection + transcript extraction (`youtube-transcript`)
  - [ ] Web page fetching + content extraction (`cheerio`) — check for JSON-LD Recipe schema first, fall back to body text
- [ ] Set up Gemini API client (`@google/generative-ai` SDK)
- [ ] Implement `POST /api/recipes/parse` route:
  - [ ] Extract content from URL
  - [ ] Send to Gemini with recipe parsing prompt
  - [ ] Return structured JSON
- [ ] Create recipe display component:
  - [ ] Title and servings
  - [ ] Ingredients list (with metric quantities)
  - [ ] Prep steps section (each step shows its ingredients)
  - [ ] Cooking steps section (each step shows its ingredients)
- [ ] Manual testing with 5-10 diverse recipes (blog posts, YouTube videos, different cuisines)
- [ ] Iterate on the parsing prompt based on results

**Done when:** You can paste a URL, get a clean structured recipe, and the metric conversions are reasonable.

## Phase 2: Database + saved recipes

Persist recipes so they aren't lost on refresh.

### Tasks

- [ ] Set up Vercel Postgres
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

- [ ] Set up NextAuth.js with Google provider
- [ ] Create Google OAuth credentials (Google Cloud Console)
- [ ] Add auth middleware — protect all routes except `/login`
- [ ] Add `AUTHORIZED_EMAIL` check — reject logins from other Google accounts
- [ ] Add user_id to recipes table, associate recipes with the logged-in user
- [ ] Add login/logout UI

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
- [ ] Deploy to Vercel with production env vars
- [ ] Custom domain (optional)

## Dependencies to install

```bash
# Core
npx create-next-app@latest prepd --typescript --tailwind --eslint --app --src-dir

# LLM
npm install @google/generative-ai

# Content extraction
npm install youtube-transcript cheerio

# Database
npm install drizzle-orm @vercel/postgres
npm install -D drizzle-kit

# Auth
npm install next-auth
```

## External accounts needed

1. **Google Cloud Console** — create a project for:
   - OAuth 2.0 credentials (for login)
   - Gemini API key (for LLM)
2. **Vercel** — deploy the app, provision Postgres database
