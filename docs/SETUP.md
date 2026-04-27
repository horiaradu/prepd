# Setup Guide

Everything you need to create, configure, and connect before writing code.

## 1. GitHub Repository

1. Go to https://github.com/new
2. Create a new repository:
   - Name: `prepd`
   - Private
   - No template, no README (we already have one)
3. From the local `prepd` folder:
   ```bash
   git init
   git add .
   git commit -m "Initial project docs"
   git remote add origin git@github.com:<your-username>/prepd.git
   git push -u origin main
   ```

## 2. Google Cloud Project

A single Google Cloud project provides both OAuth (login) and Gemini API (LLM).

### Create the project

1. Go to https://console.cloud.google.com/
2. Click **Select a project** → **New Project**
3. Name: `prepd`
4. Create

### Enable Gemini API

1. In the project, go to **APIs & Services** → **Library**
2. Search for **Generative Language API** (this is the Gemini API)
3. Click **Enable**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy the key → this is your `GEMINI_API_KEY`
7. (Optional) Restrict the key to the Generative Language API only

### Set up OAuth 2.0 (for Google Login)

1. In the same project, go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (even though it's just you — Internal requires a Workspace org)
3. Fill in:
   - App name: `Prepd`
   - User support email: your email
   - Developer contact: your email
4. Scopes: add `email`, `profile`, `openid`
5. Test users: add your Google email
6. Save

7. Go to **APIs & Services** → **Credentials**
8. Click **Create Credentials** → **OAuth client ID**
9. Application type: **Web application**
10. Name: `Prepd Web`
11. Authorized JavaScript origins:
    - `http://localhost:3000` (dev)
    - `https://prepd.vercel.app` (prod — add after first deploy)
12. Authorized redirect URIs:
    - `http://localhost:3000/api/auth/callback/google` (dev)
    - `https://prepd.vercel.app/api/auth/callback/google` (prod — add after first deploy)
13. Create → copy **Client ID** and **Client Secret**

**Note:** While in "Testing" publishing status, only the test users you added can log in. This is fine — you don't need to publish the app.

## 3. Vercel

### Account & project

1. Go to https://vercel.com/ and sign in with GitHub
2. Click **Add New Project** → import the `prepd` GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Don't deploy yet — we need env vars first

### Vercel Postgres

1. In the Vercel dashboard, go to **Storage** → **Create Database**
2. Select **Postgres**
3. Name: `prepd-db`
4. Region: pick the closest to you (e.g., `eu-west-1` for Europe)
5. Create
6. Connect it to your `prepd` project
7. Vercel auto-injects `POSTGRES_URL` (and related vars) into your project's environment

For local development, go to the database page → **`.env.local` tab** → copy the connection string snippet into your `.env.local`.

## 4. Environment Variables

### Local (`.env.local`)

Create `.env.local` in the project root:

```bash
# Auth (from Google Cloud Console → OAuth credentials)
GOOGLE_CLIENT_ID=<from step 2>
GOOGLE_CLIENT_SECRET=<from step 2>
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
AUTHORIZED_EMAIL=<your Google email>

# Database (from Vercel Postgres dashboard → .env.local tab)
POSTGRES_URL=<from Vercel>
POSTGRES_PRISMA_URL=<from Vercel, if provided>
POSTGRES_URL_NON_POOLING=<from Vercel, if provided>

# LLM (from Google Cloud Console → API key)
GEMINI_API_KEY=<from step 2>
```

### Vercel (production)

In the Vercel project dashboard → **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `GOOGLE_CLIENT_ID` | from Google Cloud | |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud | |
| `NEXTAUTH_SECRET` | random 32-byte base64 | Generate a different one from local |
| `NEXTAUTH_URL` | `https://prepd.vercel.app` | Or your custom domain |
| `AUTHORIZED_EMAIL` | your email | |
| `GEMINI_API_KEY` | from Google Cloud | |

`POSTGRES_URL` is auto-injected by Vercel when you connect the database — no need to set it manually.

## 5. Local Development Prerequisites

```bash
# Node.js (LTS)
nvm install --lts
nvm use --lts

# Verify
node -v  # Should be 20+ or 22+
npm -v
```

No Docker needed — the database is remote (Vercel Postgres). If you later want a local Postgres for offline dev, you can add Docker, but it's not necessary to start.

## Checklist

- [ ] GitHub repo created and local folder pushed
- [ ] Google Cloud project created (`prepd`)
- [ ] Gemini API enabled + API key generated
- [ ] OAuth consent screen configured with your email as test user
- [ ] OAuth client ID + secret created with correct redirect URIs
- [ ] Vercel project created (linked to GitHub repo)
- [ ] Vercel Postgres database provisioned and connected
- [ ] `.env.local` file created with all variables filled in
- [ ] Vercel environment variables set for production
- [ ] Node.js LTS installed
