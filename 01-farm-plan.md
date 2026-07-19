# FaRm — Lighthouse 90+ Remediation Plan
**URL:** https://farm-direct-marketplace-eta.vercel.app/
**Current state:** BROKEN — `NO_FCP` (page never paints). All categories score 0/6. This is not a scoring problem, it's a deployment/runtime failure. Fix Phase 1 before anything else matters.

---

## Phase 1 — Get the app to actually render (blocking, do first)

1. **Reproduce and diagnose**
   - Open the live URL in an incognito tab, DevTools open, hard refresh.
   - Record: Console errors (red text), Network tab (any failed/red requests, especially API calls), whether it's a white screen forever or something briefly flashes.

2. **Check environment variables**
   - Compare local `.env` (or `.env.local`) against the environment variables actually set in the Vercel project dashboard (Settings → Environment Variables).
   - Confirm the frontend's API base URL variable (e.g. `REACT_APP_API_URL` / `VITE_API_URL`) points to the deployed backend, not `localhost`.
   - Redeploy after any env var change (Vercel doesn't hot-apply these).

3. **Check backend availability**
   - Confirm the backend (wherever it's hosted — Render/Railway/etc.) is actually running and not sleeping/crashed.
   - If on a free tier with cold starts, test how long the first request takes. If it's 20s+, that's likely the direct cause of `NO_FCP`.

4. **Add a render-first loading state**
   - Ensure the top-level app shell (nav, layout, a spinner/skeleton) renders unconditionally and immediately, BEFORE any data fetch resolves.
   - Audit top-level components for code that could throw before first render — e.g. accessing `data.map(...)` before `data` exists. Guard with optional chaining / default state, don't let a fetch failure crash the whole tree.

5. **Verify build output**
   - Confirm `vercel.json` / build settings match the actual framework (CRA vs Vite vs Next) and that the build isn't serving a stale/broken artifact.

**Exit criteria for Phase 1:** loading the URL in a fresh browser shows visible content within ~2-3 seconds, with no console errors, even if data is still loading.

---

## Phase 2 — Performance (target 90+)
Re-run Lighthouse once Phase 1 is done; use the real metrics, but expect these standard MERN issues:

- **Code-split routes** with `React.lazy()` + `Suspense` — don't ship the whole app bundle on first load.
- **Audit bundle size** — run `npm run build` and check output size; remove unused dependencies; import specific functions (`import debounce from 'lodash/debounce'`) instead of whole libraries.
- **Images:** convert to WebP/AVIF where possible, add explicit `width`/`height` (or CSS `aspect-ratio`) to every `<img>` to avoid layout shift, lazy-load below-the-fold images (`loading="lazy"`).
- **Fonts:** use `font-display: swap`, preload critical fonts, avoid loading unused font weights.
- **Minify CSS/JS:** confirm production build minifies output (should be default in CRA/Vite, but verify `build/` or `dist/` isn't shipping dev bundles).
- **Reduce main-thread work:** check for expensive synchronous operations on mount (large `.map()`/`.filter()` over big arrays, unthrottled state updates).

## Phase 3 — Accessibility (target 90+)
- Add `alt` text to every image.
- Ensure every form input has an associated `<label>`.
- Add a `<title>` and confirm proper heading hierarchy (`h1` → `h2` → `h3`, no skipping).
- Add `lang="en"` (or correct locale) to the `<html>` tag.
- Check color contrast on all text/background pairs (WCAG AA = 4.5:1 for body text) — run through a contrast checker and adjust brand colors if needed.
- Ensure all interactive elements (buttons, custom dropdowns) are keyboard-focusable and have visible focus states.
- Add ARIA roles/labels only where semantic HTML isn't enough (prefer `<button>`/`<nav>`/`<main>` over `<div role="...">`).

## Phase 4 — Best Practices (target 90+)
- Confirm HTTPS is enforced (Vercel does this by default — verify no mixed content warnings).
- Add a Content-Security-Policy header if missing.
- Check browser console for zero errors/warnings on load.
- Remove any deprecated APIs flagged.
- Add source maps for production debugging (`GENERATE_SOURCEMAP=true` for CRA, or Vite equivalent) — doesn't affect score but agent should do this for maintainability.

## Phase 5 — SEO (target 90+)
- Add unique `<title>` and `<meta name="description">` per page/route.
- Add a valid `robots.txt` at the root (served as a static file, not blocked).
- Ensure all links are crawlable (`<a href="...">`, not `onClick`-only navigation with no `href`).
- Add `rel="canonical"` tags.
- If using client-side routing, confirm pages return proper HTTP status codes (no soft-404s).

## Phase 6 — Agentic Browsing (bonus, lower priority)
- Fix CLS (Phase 2 image/font fixes handle most of this).
- Add an `llms.txt` file at the root describing the site for AI crawlers.
- Ensure the accessibility tree is well-formed (mostly resolved by Phase 3 semantic HTML fixes).

---

## Instruction block to hand to your coding agent
> "Audit the FaRm codebase. First priority: the deployed app at https://farm-direct-marketplace-eta.vercel.app/ shows a blank page with Lighthouse NO_FCP error — find and fix why the app fails to render in production (check env vars, API connectivity, top-level render-blocking errors, add loading fallbacks). Once confirmed rendering, work through Phases 2-6 above in order, re-running Lighthouse after each phase, until all categories score 90+."
