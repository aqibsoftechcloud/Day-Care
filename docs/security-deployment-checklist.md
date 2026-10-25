# DCS security deployment checklist

Operator checklist for deploying the security hardening (sanitization, rate limits, session revocation, headers, Secure cookies).
Nothing here has been verified against a real production environment — each item is a fact the operator must confirm.

## 1. Facts to confirm before go-live

| # | Confirm | Why it matters | How to check |
|---|---|---|---|
| 1 | The site is served **only over HTTPS**; plain HTTP redirects to HTTPS (or is not exposed). | Session cookies are `Secure` and will not be sent over HTTP. HSTS is only safe on HTTPS-only sites. | `curl -sI http://<host>/` → 301/308 to `https://`. |
| 2 | Where **TLS terminates** (CDN / load balancer / nginx / the app). | Decides the hop count below. The app itself speaks plain HTTP behind a proxy; that is fine, cookies stay `Secure`. | Deployment diagram. |
| 3 | **Number of trusted reverse proxies** in front of the app (CDN + LB + nginx each count). | `TRUSTED_PROXY_HOPS` reads the client IP as the Nth-from-last `X-Forwarded-For` entry. Too low → every user may be bucketed as the proxy IP (shared rate limits). Too high → a client can forge its IP and evade limits. | Send `X-Forwarded-For: 1.1.1.1` through the public URL and inspect what the app receives (temporary log, not committed). |
| 4 | Each trusted proxy **appends** the connecting address to `X-Forwarded-For` (does not just pass the client's value). | The right-to-left parsing relies on this. | Proxy config / test as above. |
| 5 | The **application port is not reachable directly** from the internet or other untrusted networks (firewall / security group / bind to a private interface). | A direct caller can send its own `X-Forwarded-For` and rotate fake IPs, bypassing per-IP login and lead limits. With a direct-exposure deployment set `TRUSTED_PROXY_HOPS=0` (all traffic shares one bucket) rather than trust the header. | From outside the proxy network: `curl http://<host>:<app-port>/` must fail. |
| 6 | `NODE_ENV=production` (`next start` sets it). `ALLOW_INSECURE_SESSION_COOKIE` is **not set**. | The cookie is `Secure` by default; the opt-out is honoured only when `NODE_ENV=development` and is ignored in production regardless. | Log in via HTTPS and inspect `Set-Cookie`: `Secure; HttpOnly; SameSite=lax`. |
| 7 | `uploads` storage (`public/uploads`) is persistent and writable, backed up, and shared if there is more than one instance. | Uploads are stored on local disk. Not changed by this work, but multi-instance deployments need shared storage. | Ops review. |
| 8 | The database user has `CREATE`/`ALTER` for the migration run. | The two migrations create a table and add a column. | `prisma migrate deploy` output. |

## 2. Environment variables

Required (existing): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `USER_ID_ENCRYPTION_KEY`, `AI_CONFIG_ENCRYPTION_KEY`.
Also read by code: `NEXT_PUBLIC_SITE_URL` (public URLs / SEO) and `DATABASE_URL` (Prisma tooling).

Introduced or relevant to this work:

| Variable | Production value | Notes |
|---|---|---|
| `TRUSTED_PROXY_HOPS` | **Set explicitly** to the real proxy count from item 3. | Unset defaults to `1`. `0` = ignore forwarding headers (direct exposure). |
| `ENABLE_HSTS` | `true` **only after** item 1 is confirmed. | Adds `Strict-Transport-Security: max-age=31536000; includeSubDomains`. No `preload`. Browsers cache HSTS for a year — do not enable on a site that may still need HTTP. |
| `ALLOW_INSECURE_SESSION_COOKIE` | **Never set.** | Development-only opt-out (`NODE_ENV=development` + exactly `true`), e.g. testing from another device over plain HTTP. Ignored everywhere else. |
| `NODE_ENV` | `production` | |

Never commit or print secret values; rotate `JWT_SECRET` to invalidate every session at once.

## 3. Migration order (project-specific commands)

Run from the project root with `.env` (or real environment) providing the `DB_*` variables — `prisma7.config.ts` builds the connection URL from them.

1. Back up the database.
2. `npx prisma migrate deploy --config prisma7.config.ts` — applies, in order:
   1. `20261023100000_add_rate_limit_events` — `CREATE TABLE rate_limit_events` (+2 indexes). Additive.
   2. `20261023120000_add_user_session_version` — `ALTER TABLE users ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0`. Additive; existing rows become 0.
3. `npx prisma generate --config prisma7.config.ts` (generates into `app/generated/prisma`).
4. `npm run build`, then start the new build (`npm start`).

**Migrate before starting the new code**: the new code selects `session_version` and writes `rate_limit_events`; the old code ignores both, so the migrated database is compatible with old and new builds. Running `migrate status --config prisma7.config.ts` should report "Database schema is up to date".

Session behaviour at cut-over: tokens issued before the migration carry no version claim and are read as version 0 (equal to the new column default), so currently signed-in admins stay signed in until their next logout / password change / 24 h expiry. Rotating `JWT_SECRET` forces everyone to re-authenticate if you prefer a clean cut.

## 4. Post-deployment smoke tests

Run against the real URL with synthetic or read-only requests; do not use production data for the write checks.

- `curl -sI https://<host>/` → 200 with `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; no `X-Powered-By`; `Strict-Transport-Security` present only if `ENABLE_HSTS=true`.
- `curl -s -o /dev/null -w '%{http_code}' https://<host>/api/test-db` → 404.
- `/dcs-panel/login` loads; sign in with a real admin; `Set-Cookie` shows `Secure; HttpOnly; SameSite=lax`; panel pages load without CSP errors in the browser console.
- Logout, then reuse the old cookie against `/api/auth/me` → 401.
- Public pages (home, a city page, a doctor page, `/search?q=a`, `/contact-us`) render; submit the consultation form once with a clearly fake test lead and delete it afterwards.
- Rate limits: 6 failed logins for a fake email from one client → 6th returns 429 with `Retry-After`; confirm the client IP the app sees is the real one (not the proxy's) — otherwise fix `TRUSTED_PROXY_HOPS`.
- In-repo suites (local/staging only, they create and delete synthetic rows): `npm run test:security`, `test:security:integration`, `test:security:session`, `test:security:richtext`, `test:security:richtext-more` (the last four need `BASE_URL` and a non-production database).

## 5. Rollback considerations

- Both migrations are additive and the old build ignores the new table/column, so rolling the **application** back does not require rolling the database back. Prefer leaving the schema in place.
- Rolling back the code loses: rate limiting, session revocation (outstanding tokens would simply stop being version-checked), save/render sanitization, headers and the Secure-by-default cookie. Treat a rollback as temporary.
- If the schema must be reverted: `DROP TABLE rate_limit_events;` and `ALTER TABLE users DROP COLUMN session_version;` — only after the old build is running, and also remove the two rows from `_prisma_migrations` so a later deploy re-applies them.
- Sanitization changes stored HTML only on save; content saved while the new build ran stays sanitized after a rollback (that is not harmful).
- `ENABLE_HSTS` is not rollback-safe: browsers cache it for up to a year. Enable it last, after HTTPS has been stable.

## 6. Known residual risks (unchanged by this work)

- CSP `script-src` allows `'unsafe-inline'` (a nonce policy would force dynamic rendering). Sanitization is the primary XSS defence; a CSP nonce for `/dcs-panel` only is the suggested next step.
- Revocation is per user, not per device: logout or a password change ends all of that user's sessions.
- Rate limiting is DB-backed; very high-volume abuse still costs database queries per request. A CDN/WAF rate limit in front is recommended.
- Uploaded files live on local disk (item 7).
