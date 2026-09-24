# Sonexa gateway (Cloudflare Worker)

Serves Sonexa at `https://staging-sonexa.devgyana.in`. Every request is proxied
to the Render service; if Render is suspended (free-tier hours used up),
returns 502–504, or doesn't answer within `ORIGIN_TIMEOUT_MS`, visitors get a
branded maintenance page (`src/maintenance.html`) with HTTP 503. The page
re-checks every 60 seconds, so users land back in the app automatically once
Render is up again. Non-HTML requests (API calls) get a JSON 503 instead.

## One-time setup

1. **Move DNS for `devgyana.in` to Cloudflare** (required for Worker custom domains).
   - Cloudflare dashboard → *Add a domain* → `devgyana.in` → Free plan.
   - Check the imported DNS records (keep any MX/TXT records for email).
   - GoDaddy → *My Products* → `devgyana.in` → *DNS* → *Nameservers* →
     *Change* → *I'll use my own nameservers* → enter the two nameservers
     Cloudflare shows. Wait until Cloudflare marks the zone **Active**.
2. **Point the Worker at Render.** Set `ORIGIN_URL` in `wrangler.toml` to the
   service's `*.onrender.com` URL (Render dashboard → service → top of page).
3. **Deploy:**
   ```sh
   cd infra/maintenance-worker
   npx wrangler login
   npx wrangler deploy
   ```
   Wrangler creates the `staging-sonexa.devgyana.in` DNS record and certificate.
4. **Update the app's URL on Render** (service → *Environment*):
   `NEXTAUTH_URL=https://staging-sonexa.devgyana.in`, and add
   `https://staging-sonexa.devgyana.in/api/auth/callback/google` (and
   `/github`) as OAuth redirect URIs in Google/GitHub.

## Operating it

- Preview the page locally: `npx wrangler dev --var FORCE_MAINTENANCE:true`
- Force maintenance mode in production (e.g. during a migration): set
  `FORCE_MAINTENANCE = "true"` and `npx wrangler deploy`.
- Logs: `npx wrangler tail`
