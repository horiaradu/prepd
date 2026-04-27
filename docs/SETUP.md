# Setup Guide

Everything you need to create, configure, and connect before writing code.

## 1. GitHub Repository ✅

Repo created at `git@github.com:horiaradu/prepd.git` (private).

## 2. Google Cloud Project ✅

Project `prepd` created. Gemini API enabled. OAuth 2.0 configured.

### Credentials

- **Gemini API key** → stored in `.env` as `GEMINI_API_KEY`
- **OAuth Client ID/Secret** → stored in `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google` (dev)
  - `https://prepd-ten.vercel.app/api/auth/callback/google` (prod)
- OAuth consent screen: External, test user added

## 3. Vercel ✅

App deployed at `https://prepd-ten.vercel.app`.

### Database (Neon Postgres) ✅

Provisioned via Vercel marketplace (Frankfurt region, free tier). Connection strings auto-injected into Vercel env vars.

## 4. Environment Variables \u2705

### Local (`.env`)

All variables configured in `.env` (gitignored):

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
AUTHORIZED_EMAIL=horia.radu23@gmail.com
GEMINI_API_KEY=...
DATABASE_URL=...     # Neon Postgres connection string
```

### Vercel (production)

Set in Vercel project dashboard → **Settings** → **Environment Variables**:

| Variable | Notes |
|----------|-------|
| `GOOGLE_CLIENT_ID` | from Google Cloud |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud |
| `NEXTAUTH_SECRET` | random 32-byte base64 |
| `NEXTAUTH_URL` | `https://prepd-ten.vercel.app` |
| `AUTHORIZED_EMAIL` | `horia.radu23@gmail.com` |
| `GEMINI_API_KEY` | from Google Cloud |

`DATABASE_URL` and related Postgres vars are auto-injected by the Neon integration.

## 5. Local Development

```bash
nvm use        # uses .nvmrc (Node 24)
npm ci
npm run dev    # starts on http://localhost:3000
```

No Docker needed — the database is remote (Vercel Postgres). If you later want a local Postgres for offline dev, you can add Docker, but it's not necessary to start.

## Checklist

- [x] GitHub repo created and local folder pushed
- [x] Google Cloud project created (`prepd`)
- [x] Gemini API enabled + API key generated
- [x] OAuth consent screen configured with your email as test user
- [x] OAuth client ID + secret created with correct redirect URIs
- [x] Vercel project created (linked to GitHub repo)
- [x] Neon Postgres database provisioned and connected via Vercel
- [x] `.env` file created with all variables filled in
- [x] Vercel environment variables set for production
- [x] Node.js 24 (`.nvmrc`)
