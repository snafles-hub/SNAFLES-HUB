# Deployment Guide

This guide covers the minimum steps to deploy SNAFLEShub to a production or staging environment. It applies whether you host on a VM (DigitalOcean, AWS EC2), container platform (ECS, Kubernetes), or a PaaS (Railway, Render). Adapt the commands to your target platform.

## 1. Prerequisites

- Node.js 18+ on the API host
- MongoDB 6.x (Atlas, DocumentDB, or self-managed)
- Reverse proxy handling TLS (Nginx, Caddy, AWS ALB, Cloudflare)
- Dedicated secrets store or environment management

## 2. Environment Variables

Create the following environment variables for the API process:

```
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
FRONTEND_URL=https://app.snafleshub.com
CORS_ORIGINS=https://app.snafleshub.com
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.example.mongodb.net/snafleshub
JWT_SECRET=change-me-super-long-random-string
RATE_LIMIT_WINDOW_MS=900000             # optional override (15 min default)
RATE_LIMIT_MAX=300
RATE_LIMIT_AUTH_MAX=100
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...         # when webhooks are enabled
EMAIL_HOST=smtp.example.com             # optional email integration
EMAIL_PORT=587
EMAIL_USER=no-reply@snafleshub.com
EMAIL_PASS=app-password
DEFAULT_VENDOR_LOGO=<https://...>       # optional branding fallback
DEFAULT_VENDOR_BANNER=<https://...>
```

Frontend build-time variables (`frontend/.env.production` or platform UI):

```
VITE_API_URL=https://api.snafleshub.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_NAME=SNAFLEShub
```

Never reuse development keys in production. Rotate and revoke compromised secrets immediately.

## 3. Build & Ship the Frontend

```bash
cd frontend
npm ci
npm run build
# upload dist/ to your CDN (S3 + CloudFront, Netlify, Vercel, etc.)
```

Recommended headers from your CDN/edge:

- `Cache-Control: public,max-age=31536000,immutable` for hashed assets
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` mirroring the API settings (script/style/images/fonts)

## 4. Run the API

```bash
cd backend
npm ci
npm run build   # optional, if you compile TypeScript in the future
PORT=5000 NODE_ENV=production pm2 start server.js --name snafles-api
pm2 save
```

Process management options:

- **PM2** with `pm2 save && pm2 startup`
- **systemd** service pointing to `node server.js`
- **Docker** – build an image and mount environment variables/secrets

Expose only the reverse proxy to the internet; keep the Node process on a private network.

## 5. Reverse Proxy Configuration

Example Nginx server block:

```
server {
  listen 443 ssl http2;
  server_name api.snafleshub.com;

  ssl_certificate /etc/letsencrypt/live/api.snafleshub.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.snafleshub.com/privkey.pem;

  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

  location /api/ {
    proxy_pass http://127.0.0.1:5000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Serve the frontend (Netlify, Vercel, Nginx static block, etc.) and proxy `/api` requests back to the API origin. Ensure the frontend base path (`VITE_API_URL`) lines up with the proxy route.

## 6. Database & Seed Data

1. Provision a MongoDB database with IP allow lists restricted to your API host or VPC.
2. Create a least-privilege user with read/write permissions on the `snafleshub` database only.
3. Run the seed script once if you want demo content:
   ```bash
   cd backend
   npm run seed
   ```
4. Schedule backups or enable Atlas backups. Test restores periodically.

## 7. Logging & Monitoring

- Capture stdout/stderr via PM2 log rotation or ship them to a central collector (ELK, Datadog).
- Enable application-level metrics (CPU, memory, request latency) plus MongoDB metrics.
- Set alerts on high error rates (5XX responses), login failures, and rate-limit triggers.

## 8. Post-Deploy Checklist

- Verify HTTPS with SSL Labs (A or better).
- Confirm CSP blocks unwanted origins and allows all required assets (fonts, Stripe, GA if enabled).
- Run `node run-e2e.js --frontend-origin=https://app.snafleshub.com --backend-origin=https://api.snafleshub.com` against the live stack or a staging clone.
- Review `SECURITY.md` and close any gaps (secret rotation policy, MFA on cloud accounts, incident response playbook).

## 9. Rollback Plan

- Keep the previous frontend bundle in your CDN (versioned object key).
- Use PM2/systemd to maintain at least one standby process with the previous server build.
- Maintain database snapshots so you can roll back schema or data changes if an incident occurs.

---

Questions or suggestions for improving the deployment story? Open an issue or PR so we can keep this document accurate.
