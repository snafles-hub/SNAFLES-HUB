# Repository Guidelines

## Project Structure & Module Organization
Frontend code lives in `frontend/src/`, with smart components in `components/`, route views in `pages/`, shared state in `contexts/`, and API helpers in `services/` and `utils/`. Static assets and the Vite entry HTML sit in `frontend/public/`. The Express API is in `backend/`, split across `models/`, `routes/`, `middleware/`, `services/`, and `scripts/` for DB upkeep. Frontend configs (`frontend/vite.config.js`, `frontend/tailwind.config.js`, `frontend/postcss.config.js`) drive the React build.

## Build, Test, and Development Commands
From `frontend/`, install everything with `npm run install:all`. Prefer `node run-dev.js` at the repo root to launch both dev servers together; the runner installs frontend/backend dependencies automatically the first time it runs. Use `--mock-backend`, `--backend-port`, and `--frontend-port` when you need the mock API or alternative ports. When you need manual control, run the Vite dev server via `npm run dev`, preview a production bundle with `npm run preview`, and produce it with `npm run build`. The backend mirrors these flows: `npm run start:backend` (nodemon against the live API) or `npm run start:backend:dev:mock` for the mock server. Inside `backend/`, use `npm run dev`, `npm run dev:mock`, and call `npm run seed` or `npm run reset:db` to refresh fixtures.

## Coding Style & Naming Conventions
Match the two-space indentation used in JS/JSX. Keep ES modules with React function components and hooks. Components and context providers stay PascalCase (e.g., `HelperPointsPage.jsx`); utilities remain camelCase. Styling relies on Tailwind utility classes. Run `npm run lint` before committing—the ESLint config blocks unused disables and React anti-patterns, so fix warnings rather than suppress them. Colocate component-specific helpers beside the owning component.

## Testing Guidelines
Run the headless smoke test with `npm run test:e2e` (or `node run-e2e.js`) at the repo root—it installs dependencies, boots the mock backend + frontend, drives a Puppeteer browser flow through the home and products pages, and drops a screenshot in `tests/e2e/artifacts/`. Still perform manual smoke checks for checkout, authentication, or vendor dashboards when you touch them. If you add deeper automation, colocate Vitest/RTL specs under `frontend/src/__tests__/` and mirror the folder structure.

## Commit & Pull Request Guidelines
Follow the short, imperative history (`feat:`, `server:`, `order-success:`). Squash related work and commit once the linter passes. PRs should state the problem, the fix, and how you tested; link Jira or GitHub issues when possible. Include UI before/after context and flag backend schema updates so reviewers can reset seed data.

## Security & Configuration Tips
Never commit `.env` files—follow `frontend/env.example` and `backend/env.example`. Run `node generate-ssl.js` only on trusted machines and keep certs out of version control. Stripe keys belong in `frontend/.env.local` and backend `.env`; rotate them if exposed. When adding API routes, confirm CORS and rate-limit settings in `backend/config/` still protect unauthenticated access.
