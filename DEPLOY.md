# Deploying Codelens (free tier)

```
Vercel (Next.js)  ->  Render (Spring Boot)  ->  Render (Python engine)  ->  OpenRouter
                              |
                              v
                     Neon (PostgreSQL)
```
Costs: Vercel Hobby free (non-commercial), Render free web services,
Neon free Postgres. No credit card needed for these three (checked Oct 2026 -
limits change, so glance at each pricing page).

## 0. Put the code on GitHub
Install Git, create an empty repo on github.com (private is fine), then in the
project folder (the one containing backend, frontend, ai-engine):
```
git init
git add .
git status
git commit -m "Codelens"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/codelens.git
git push -u origin main
```
Before pushing, run `git status` and make sure `.env`, `data/`, `node_modules/`
and `target/` are NOT listed (the included .gitignore excludes them).
Never push your OpenRouter key.

## 1. Database (Neon)
1. neon.com -> sign up -> create a project (any name, Postgres, pick a region).
2. Click Connect. Turn OFF "Connection pooling" (use the direct connection).
3. You get: `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`
   Convert it into three values:
   - JDBC_DATABASE_URL = `jdbc:postgresql://HOST/neondb?sslmode=require`
   - DB_USER = USER
   - DB_PASSWORD = PASSWORD

## 2. AI engine (Render)
Render -> New -> Web Service -> pick your GitHub repo.
- Name: codelens-engine   - Root Directory: `ai-engine`
- Language/Runtime: Docker   - Instance type: Free

| Environment variable | Value |
|---|---|
| OPENROUTER_API_KEY | your OpenRouter key |
| OPENROUTER_MODEL | `openrouter/auto` (or your model) |
| ENGINE_API_KEY | invent a long random secret (40+ characters) |

After it deploys, open `https://codelens-engine.onrender.com/health`.

## 3. Backend (Render)
New -> Web Service -> same repo.
- Name: codelens-backend   - Root Directory: `backend`
- Runtime: Docker   - Instance type: Free

| Environment variable | Value |
|---|---|
| JDBC_DATABASE_URL | from step 1 |
| DB_USER | from step 1 |
| DB_PASSWORD | from step 1 |
| JWT_SECRET | invent another long random secret (48+ characters) |
| AI_ENGINE_URL | `https://codelens-engine.onrender.com` (your engine URL) |
| ENGINE_API_KEY | EXACTLY the same value as on the engine |
| CORS_ORIGINS | your Vercel URL (add it after step 4; use a placeholder first) |

The first build takes 5-10 minutes and the first start 2-4 minutes on the free CPU.
Check: `https://codelens-backend.onrender.com/api/reviews` shows 401 = running.

## 4. Frontend (Vercel)
vercel.com -> Add New -> Project -> import the repo.
- Root Directory: `frontend`  (framework is detected as Next.js)
- Environment variable: `NEXT_PUBLIC_API_URL` = `https://codelens-backend.onrender.com`
  (no slash at the end). It is baked in at build time: if you change it, redeploy.
- Deploy. You get `https://something.vercel.app`.

## 5. Allow the frontend (CORS)
Render -> codelens-backend -> Environment -> set
`CORS_ORIGINS` = `https://something.vercel.app` -> Save (it redeploys).
Only this exact address is allowed. Several addresses: separate with commas.

## 6. Test
Open the Vercel address, sign up, run a review, open it, try "Show fixed code".

## Free-tier facts you must know
- Render free web services sleep after 15 minutes without traffic and need
  about a minute or more to wake (longer for Spring Boot). BEFORE A DEMO, open
  the backend URL, then the engine /health, then the website, 5 minutes earlier.
- Render gives 750 free hours per month across your services. Two services kept
  awake 24/7 would use ~1,490 hours, so do not add keep-alive pings all month.
- Do NOT use Render's free Postgres: it expires after 30 days. Neon's free plan
  does not expire (it sleeps when idle; the first query wakes it in a second).
- Free instances have little memory (about 512 MB). If the backend logs show
  "OutOfMemoryError", move it to a paid instance (about $7/month) or another host.
- Anyone can sign up on a public site and use your AI. In OpenRouter, set a
  small credit limit on the key and keep only a few dollars of credit.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| "Cannot reach the backend" | Backend is asleep (wait 1-3 min, retry), NEXT_PUBLIC_API_URL is wrong (fix and redeploy), or a CORS error (check CORS_ORIGINS; see browser console) |
| "AI engine is not reachable" | Engine asleep, AI_ENGINE_URL wrong, or ENGINE_API_KEY differs between the two services |
| Backend log: Could not resolve placeholder 'JWT_SECRET' (or JDBC_DATABASE_URL...) | That environment variable is missing on the backend |
| Backend log: database connection failed | JDBC URL must start with `jdbc:postgresql://`, use the direct (non-pooled) Neon host, keep `?sslmode=require` |
| Logged out after the backend restarts | Normal only if JWT_SECRET changed; keep it fixed |

Running on your own PC still works exactly as before (all new settings have
local defaults).
