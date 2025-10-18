# Security Posture

SNAFLEShub ships with a hardened baseline suitable for staging and production environments. This document summarises the controls that are already in place and lists the configuration steps you must complete before go-live.

## Authentication & Session Management
- **JWT in HttpOnly cookies** – login/register/vendor/admin flows now set the access token via an HttpOnly cookie (`token`). No bearer tokens are stored in `localStorage` or exposed to client-side scripts.
- **CSRF protection** – a double-submit token is issued through `GET /api/auth/csrf`. All state-changing requests include the `X-CSRF-Token` header, and the backend rejects mismatches with `403`.
- **Logout safety** – `POST /api/auth/logout` clears the HttpOnly cookie and rotates the CSRF token so abandoned browser tabs cannot replay the session.
- **JWT Secret checks** – the API refuses to boot in production if `JWT_SECRET` is not configured.

## Request Hardening
- **Sanitisation middleware** removes keys that begin with `$` or contain `.` from `req.body`, `req.query`, and `req.params`, mitigating common NoSQL-injection vectors.
- **Helmet** is enabled across mock and real servers. In production the API enforces CSP, HSTS (1 year, preload), and a strict referrer policy.
- **Rate limiting** applies globally, with tighter thresholds for `/api/auth/*` endpoints. Configure `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, and `RATE_LIMIT_AUTH_MAX` as needed.
- **CORS** allows only whitelisted origins (`CORS_ORIGINS`, `FRONTEND_URL`) while still supporting credentials.
- **Compression & trust proxy** are enabled so reverse proxies (Nginx/Cloudflare) can pass the real client IP for logging/limiting.

## Secrets & Environment
- Never commit `.env` files. Use `backend/env.example` and `frontend/env.example` as the canonical template.
- Differentiate secrets by environment (`JWT_SECRET`, Stripe keys, SMTP credentials). Rotate immediately if exposed.
- On shared infrastructure, scope MongoDB users to the database and enforce TLS between your app and Atlas/cluster.

## Frontend Considerations
- The frontend never stores or reads JWTs from `localStorage`.
- API helpers (`frontend/src/services/api.js`) automatically refresh CSRF tokens, attach credentials, and retry once after an `HTTP 403` to minimise race conditions.
- GA instrumentation (`src/ga.js`) is gated to production builds with `VITE_GA_ID` to avoid leaking dev traffic.

## Operational Checklist
1. Set `NODE_ENV=production`, `JWT_SECRET`, `CORS_ORIGINS`, and `FRONTEND_URL` before deploying the API.
2. Serve the app behind TLS and forward the real client IP (so rate limiting and audit logs stay accurate).
3. Pin CSP directives to the exact external origins you load (fonts, Stripe, icons). Update `backend/server.js` if you add new CDNs.
4. Enable process monitoring / log aggregation (e.g. PM2 with logrotate, Datadog, ELK) so you can trace security events and failures.
5. Keep dependencies patched (`npm audit --production`) and rebuild images/instances when high severity disclosures land.

For additional operational detail see `DEPLOYMENT.md`. Contributions that tighten this checklist are welcome—open an issue or pull request.
