# Scraping API Comparison — bot-protection fallback

Context: deciding between hardening our own fetch (free) and adding a paid
scraping API as a fallback when plain fetch is bot-blocked. This documents the
paid options. Volume assumption: the service is a **fallback only** — plain
fetch runs first — so realistic usage is low hundreds of requests/month,
bounded by ~3,000 in a bad month.

**Pricing observed 2026-08-08** from official pricing pages/docs. Numbers
marked *unverified* could not be confirmed from an official page. Re-check
before purchasing — scraping-API pricing changes often.

## Comparison table

| Service | Free tier | Cheapest paid | Effective $/1k anti-bot requests | Cloudflare/DataDome bypass | Output formats | Notes |
|---|---|---|---|---|---|---|
| **ScraperAPI** | 1,000 credits/mo, recurring | $49/mo = 100k credits | ~$4.90 (CF bypass, no render) / ~$12.25 (premium + render) | **Yes — explicitly priced features** (Cloudflare, Turnstile, DataDome, PerimeterX at 10 credits each) | HTML, markdown/text (no extra cost), autoparse JSON | Only successful (200/404) requests billed; auto-retry up to ~70s |
| **Zyte API** | $5 credit, first month only | **$0/mo — pure pay-as-you-go** | ~$1.27 (HTTP, hardest tier) up to $8–16 (browser-rendered, hard tiers) | Managed ban handling included; protected sites priced into higher tiers, no explicit guarantee | HTML (http or browser), screenshots, structured JSON — **no markdown** | Only successes billed; per-request price depends on target site's difficulty tier (1–5) |
| **Firecrawl** | 1,000 credits/mo | $16/mo (annual) = 5k credits; $5/1k PAYG packs | ~$16 (Hobby) / $25 (PAYG) — anti-bot ("enhanced" proxy) costs 5 credits/request | Claimed via enhanced proxies, no explicit guarantee | **Markdown by default**, HTML, JSON extraction | `auto` proxy mode pays 5x only when escalation needed; credits don't roll over |
| **Browserless** | 1,000 units/mo | $25/mo (annual) = 20k units | ~$1.25 bare; **~$16–29 realistic** (residential bandwidth at 6 units/MB + captcha solves at 10 units) | **Yes — official BrowserQL docs claim Cloudflare (interstitial + Turnstile), DataDome, reCAPTCHA** | Whatever you script (HTML); no native markdown | Browser-automation platform, not a one-call scrape API — bypass requires writing BrowserQL |
| **ScrapingBee** | 1,000 credits, one-time | $49/mo = 250k credits | ~$4.90 (premium + JS) / ~$14.70 (stealth) — **but see caveat** | Stealth proxies claimed, no explicit guarantee | HTML, markdown, text, screenshots | **Caveat:** pricing page (browser-verified) currently gates JS rendering + premium proxies to the $249/mo Business plan; contradicts their docs — confirm before buying |
| **Jina Reader** | 20 req/min with no key; 10M tokens with free key | Pay-per-token (~pennies per 1k pages) | ~$0.10–0.40/1k pages — **but no anti-bot at all** | **No — docs explicitly state it does not bypass defenses** | **Markdown, LLM-ready** | Useless as the anti-bot fallback; viable as a free *first-line* fetcher |
| **Spider.cloud** | — ($25 minimum top-up) | PAYG: $1/GB + $0.001/min CPU | Fractions of a cent per page; failed requests free | Anti-bot unblocker with stealth + auto-retry claimed | Markdown, HTML | Cheapest raw economics but smallest operator — unproven for a reliability-first pick |

## Detail per service

### ScraperAPI
- Free tier is **recurring monthly** (unique among the credit services): 1,000
  credits ≈ 100 Cloudflare-bypass requests/month at 10 credits each — may cover
  a light fallback month entirely, forever, at $0.
- The only service that names Cloudflare, Turnstile, DataDome, and PerimeterX
  as explicitly supported, individually priced features.
- One GET request with the target URL; `output_format=markdown` at no extra
  credit cost feeds Gemini directly.
- No credit rollover; balance resets monthly.

### Zyte API
- No subscription at all — pay per successful request, default $100/mo
  spending cap. At fallback volumes this is roughly **$0.40–4/month** at 300
  requests, **$4–48/month** at 3,000, depending on which difficulty tier the
  blocked sites land in.
- Ban handling, proxy rotation, and retries are managed and included — nothing
  to configure. Price per site is unpredictable until observed (tier 1–5).
- Returns HTML, not markdown; our pipeline feeds HTML/text to Gemini anyway,
  so this costs little in practice.
- Account requires setting a spending limit after the $5 first-month credit.

### Firecrawl
- Best LLM ergonomics: markdown by default, `proxy: "auto"` escalates from
  1-credit basic to 5-credit enhanced only when needed.
- Hobby's 5,000 credits = only ~1,000 fully anti-bot pages/month; a 3,000
  bad month needs the $83 tier. Fine at the low end of our range.

### Browserless
- Strongest documented anti-bot claims (Cloudflare, DataDome, captcha solving),
  generous free tier — but it's a headless-browser platform. The bypass path
  requires writing BrowserQL (GraphQL) rather than one REST call, and
  residential bandwidth (6 units/MB) makes realistic per-page cost the highest
  of the group. Wrong ergonomics for a fallback path.

### ScrapingBee
- Historically the friendly default, but the current pricing page —
  DOM-verified in a real browser — shows JavaScript rendering and
  premium/rotating proxies **unavailable** on the $49 and $99 plans, gated to
  Business at $249/mo. Their docs still describe these as per-request credit
  parameters, so this may be a page error or a genuine restructuring. Until
  confirmed with them, assume the anti-bot entry price is $249/mo — not
  competitive here.

### Jina Reader / Spider.cloud
- Jina Reader is effectively free and outputs clean markdown, but its docs
  explicitly state it does not bypass anti-bot systems — it fails exactly
  where our plain fetch fails. It could still slot in as a free middle tier
  (plain fetch → Jina → paid service) since it fetches from different IPs and
  handles JS-rendered pages.
- Spider.cloud has the cheapest economics but the least track record.

## Assessment

For a fallback-only integration at 300–3,000 requests/month where reliability
matters more than cost:

1. **ScraperAPI — recommended.** Explicit, priced Cloudflare/DataDome support;
   the recurring free tier may cover light months at $0, and $49/mo covers the
   worst case with room to spare; single GET call; markdown output for Gemini.
   Give up: at low volume the $49 flat fee buys mostly unused capacity —
   start on the free tier and upgrade only if 1,000 credits/month runs out.
2. **Zyte API — best economics, close second.** $0 monthly, pay only for
   successes (likely single-digit dollars/month). Give up: no markdown,
   unpredictable per-site pricing, slightly more account setup friction.
3. **Firecrawl** — pick if markdown-first ergonomics matter more than the
   anti-bot ceiling; capacity gets tight at the high end of our volume range.
4. **Browserless** — only if the explicitly documented Cloudflare/Turnstile
   solving proves necessary and the others fail; costs integration effort.
5. **ScrapingBee** — not competitive until the plan-gating question is
   resolved with their support.

Decision gate: implement Phase 1 of [RELIABILITY_PLAN.md](./RELIABILITY_PLAN.md)
first — Sentry data on how often `stage=scrape` failures are 403/blocked (vs
timeouts and junk URLs) tells us whether the fallback is worth wiring in at
all, and the observed monthly volume picks between ScraperAPI's free tier and
Zyte's pay-as-you-go.
