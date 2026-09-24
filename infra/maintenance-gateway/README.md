# Sonexa gateway (Vercel)

Serves Sonexa at `https://staging-sonexa.devgyana.in`. A Vercel function
(`api/gateway.mjs`) proxies every request to the Render service. If Render is
suspended (free-tier hours used up), returns 502–504, or doesn't answer within
`ORIGIN_TIMEOUT_MS`, visitors get the branded maintenance page
(`maintenance.html`) with HTTP 503. The page re-checks every 60 seconds, so
users land back in the app automatically once Render is up again. Non-HTML
requests (API calls) get a JSON 503 instead.

DNS stays at GoDaddy; only a CNAME record for `staging-sonexa` is needed.

## Environment variables (Vercel project)

| Name | Default | Purpose |
|---|---|---|
| `ORIGIN_URL` | `https://sonexa-web.onrender.com` | Render service URL, no trailing slash |
| `ORIGIN_TIMEOUT_MS` | `70000` | How long to wait for Render (cold starts take 30–60s) |
| `FORCE_MAINTENANCE` | unset | `true` shows the maintenance page without contacting Render |

## One-time setup

1. Deploy from this directory:
   ```sh
   cd infra/maintenance-gateway
   npx vercel login
   npx vercel link          # new project "sonexa-gateway", framework: Other
   npx vercel env add ORIGIN_URL production
   npx vercel deploy --prod
   ```
2. Vercel → project → Settings → Domains → add `staging-sonexa.devgyana.in`.
   Vercel shows the DNS record it needs (a CNAME for `staging-sonexa`, and
   possibly a TXT record for verification).
3. GoDaddy → `devgyana.in` → DNS → add exactly the record(s) Vercel shows.
4. Render → service → Environment: `NEXTAUTH_URL=https://staging-sonexa.devgyana.in`,
   and add `https://staging-sonexa.devgyana.in/api/auth/callback/google` (and
   `/github`) as OAuth redirect URIs in Google/GitHub.

## Operating it

- Force maintenance mode: set `FORCE_MAINTENANCE=true` in Vercel env vars and
  redeploy (`npx vercel deploy --prod`); remove it and redeploy to turn it off.
- Logs: Vercel dashboard → project → Logs.
- Limitation: Vercel functions can't proxy WebSockets. Sonexa doesn't use them
  today; if it starts to, those connections must go straight to Render.
