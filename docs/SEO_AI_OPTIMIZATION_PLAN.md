# Plan: Optimize Mintdish for Google AI Search (AI Overviews / AI Mode)

Based on Google's [AI Optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), success in AI search ranking is mostly classic SEO done well — quality content, technical health, structured data — plus a few AI‑specific considerations (crawler access, content extractability, multimodal signals). Below is what to do, scoped to what's already in this repo.

## 1. Crawler access & indexing controls

Currently `public/robots.txt` only has a generic `User-agent: *` block. Google's AI surfaces use distinct user agents you should explicitly address:

- Add explicit `Googlebot` allow rules so all marketing routes are crawled.
- Add `Google-Extended` directive — this is the toggle for Gemini app & Vertex AI grounding (it does **not** affect AI Overviews, but controls broader generative use of your content). Decide policy and state it explicitly.
- Add `GoogleOther` (used for product research / experimental crawling).
- Keep `Disallow` for `/api`, `/inbox`, `/recipe`, `/activate`, `/invitations`, `/suggest` — these are correctly private.
- Confirm no `noindex`/`nofollow` is being emitted on the marketing routes (spot-check `(marketing-en)` and `(marketing-ro)` layouts/pages — currently they look clean).
- Verify the sitemap URL matches `NEXT_PUBLIC_SITE_URL` in production (it does).

## 2. Content quality & E‑E‑A‑T (the highest‑leverage bucket)

Google's guide is explicit that AI surfaces reward the same things classic Search does: original, helpful, people‑first content. The current marketing footprint is thin: only `welcome`, `faq`, `privacy`, `terms`, `cookies`. Plan:

- Expand the **FAQ** with the questions real users actually ask (paste a YouTube link, photo of cookbook, metric conversions, why prep‑first ordering, privacy of uploaded photos, AI‑generated images watermark, supported languages, supported sites, etc.). Each answer should be self‑contained and quotable in one paragraph — that's the format AI Overviews extract.
- Add a **`/how-it-works`** (or section on `/welcome`) page that walks through the parsing pipeline at user level — this is high-quotability content.
- Add a small **blog/guides** section (e.g. `/guides/convert-cups-to-grams`, `/guides/save-youtube-recipes`, `/guides/prep-first-cooking`). These are the long‑tail queries AI Overviews answer and are the realistic acquisition surface for a tool like this.
- Author bio / about page establishing the person behind it (E‑E‑A‑T "Experience" + "Authoritativeness" — concretely a `Person` schema linked from `Organization.founder`).
- Make sure each marketing page has a unique `<h1>`, a concise lead paragraph that answers "what is this and what does it do", and clear section headings — these are what gets summarised.

## 3. Structured data (schema.org)

Already has `Organization`, `WebSite`, `WebPage`, `SoftwareApplication`, and `FAQPage` JSON‑LD via `src/lib/structured-data.ts` — good foundation. Add:

- `WebSite.potentialAction` with a `SearchAction` if a public search ever exists (skip otherwise).
- `Organization.founder` → `Person` with `sameAs` links.
- `SoftwareApplication.featureList`, `screenshot`, `aggregateRating` (only if real reviews exist), and `inLanguage` for both locales.
- `BreadcrumbList` on FAQ / legal / future guides pages.
- For each future guide: `Article` (or `HowTo` where steps apply) with `author`, `datePublished`, `dateModified`, `image`.
- The FAQ JSON‑LD helper exists but verify it's actually rendered on `/faq` (page currently renders `<FaqPage />` only — confirm `JsonLd` is included with `faqStructuredData(...)`; if not, add it). This is the single biggest quick win.
- Validate everything in Google's Rich Results Test and the Schema Markup Validator before shipping.

## 4. Metadata, titles, canonicals, hreflang

- Titles & descriptions exist and are differentiated per page — keep them factual, not slogan‑only. AI Overviews lift descriptions verbatim, so make sure each `description` reads as a complete sentence answering "what is this page".
- `alternates.languages` is set per page — verify the RO sitemap entries match the actual route paths (`/welcome/ro`, `/faq/ro`, etc.) and that `hreflang` reciprocity is correct (each page points to the other and to itself).
- Add `og:image` with descriptive alt, and make sure `opengraph-image.png` and `twitter-image.png` are recipe‑relevant (already in `src/app`).
- Confirm `metadataBase` is set (it is, in the layouts).

## 5. Technical performance

AI search consumes the rendered DOM; if Largest Contentful Paint or hydration is slow, content is less likely to be picked up.

- Run Lighthouse / PageSpeed Insights on `/welcome` (EN + RO) and target green Core Web Vitals on mobile.
- The hero already uses `next/image` with `priority` — good. Audit other landing images for explicit `width`/`height` and `sizes`.
- Confirm marketing pages are server‑rendered (App Router default) and not gated behind client‑only logic. The `Landing` component looks server‑renderable; double-check no Provider client component shadows the static text.
- Preconnect/font: `Plus_Jakarta_Sans` via `next/font` is fine. Drop any unused subsets.
- Cache headers on `public/landing/*` images.
- Fix `viewport` and `theme-color`: in Next 15 these belong in the exported `viewport` object, not `<head>` literals; small change in `(marketing-*)/layout.tsx`.

## 6. Multimodal signals

Google's AI Mode is multimodal. For a recipe app this matters:

- Every `<Image>` on landing/FAQ should have descriptive `alt` (the screenshots currently have decent alts — extend to all).
- Ensure `opengraph-image.png` reads as a labeled product shot.
- If a short product video/gif is feasible, add it with a `VideoObject` schema (`name`, `description`, `thumbnailUrl`, `uploadDate`, `contentUrl`).
- Public recipe detail pages are currently `Disallow`ed; consider whether *some* curated, owner‑opted‑in recipes could become public — recipe pages with `Recipe` schema are heavily surfaced in AI Overviews and would be the strongest organic acquisition channel. If kept private, this is fine; just be aware it caps the SEO ceiling.

## 7. Internal linking & site structure

- Footer already links to FAQ / legal — extend with links to new guides/how-it-works once they exist.
- From `/welcome`, link to `/faq` with descriptive anchor text ("How does Mintdish parse YouTube recipes?" rather than "FAQ").
- Cross‑link EN ↔ RO via a visible language switcher (helps both users and crawlers discover hreflang).

## 8. Trust & freshness signals

- Add `dateModified` to legal docs and any future articles; AI surfaces prefer fresh, dated content.
- Public contact path (already `horia@mintdish.io` in Organization schema — also surface it in the footer / About page).
- Add a `/security` or transparency note covering data handling (photo storage, AI usage) — supports E‑E‑A‑T for a niche where privacy matters.

## 9. Measurement

- Register both `mintdish.io` in Google Search Console; submit `sitemap.xml`.
- Track impressions/clicks per query, separated by EN/RO via the property settings.
- Use Search Console's "Search appearance" filters to see when pages appear in rich results (FAQ, Software).
- Track AI Overview citations qualitatively (manual spot checks for target queries like "convert recipe url to metric", "save youtube recipe", "extract recipe from photo").

## 10. Things explicitly **not** to do

- Don't add an `llms.txt`; Google has not endorsed it, and it adds maintenance.
- Don't generate AI content to pad the site — Google's AI guide explicitly warns against scaled, low‑value content.
- Don't add review/rating schema unless reviews are real and on‑page.
- Don't unblock private routes (`/recipe`, `/inbox`, `/api`) just for SEO.

## Suggested execution order (smallest → largest leverage)

1. robots.txt update (Googlebot / Google‑Extended / GoogleOther rules).
2. Verify `JsonLd` for `faqStructuredData` is actually rendered on `/faq` (EN + RO).
3. Move `viewport`/`theme-color` to the `viewport` export; audit metadata per page.
4. Expand the FAQ content (real questions, quotable answers).
5. Add `Person` (founder) + `BreadcrumbList` schema; enrich `SoftwareApplication`.
6. Add `/how-it-works` page + 2–3 guide articles with `Article`/`HowTo` schema.
7. Lighthouse pass on mobile EN/RO; fix any LCP/CLS regressions.
8. Search Console verification + sitemap submission; monitor.
