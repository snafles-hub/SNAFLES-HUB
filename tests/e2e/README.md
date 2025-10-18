# E2E Smoke Tests

`node run-e2e.js` boots the mock backend and Vite frontend (on ports 5050/5190 by default), then uses Puppeteer to:

1. Load the home page and wait for the nav to render.
2. Navigate to the `/products` route via the Shop link.
3. Assert the products grid appears and capture a screenshot in `tests/e2e/artifacts/`.

The runner installs dependencies on first use and shuts everything down once the browser flow completes. Delete the generated artifacts before committing.
