import { lazy } from 'react';

/**
 * Robust lazy loading wrapper with auto-retry and cache-busting logic.
 * Solves "Failed to fetch dynamically imported module" / MIME type "text/html" errors
 * caused by deployment hash changes, stale Service Worker caches.
 *
 * IMPORTANT: Does NOT reload on generic network blips to prevent reload loops.
 *
 * @param {Function} componentImport Function returning dynamic import promise, e.g. () => import('./MyComponent')
 * @returns {React.LazyExoticComponent}
 */

// Minimum 8 seconds between auto-reloads — prevents reload storms from multiple
// concurrent lazy chunks all failing at once (e.g. on deployment hash change).
const RELOAD_DEBOUNCE_MS = 8000;
let lastReloadTime = 0;

export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasAlreadyBeenReloaded = sessionStorage.getItem('lazy_retry_reloaded') === 'true';

    try {
      const component = await componentImport();
      // Reset the reload flag once a dynamic import succeeds
      if (pageHasAlreadyBeenReloaded) {
        sessionStorage.removeItem('lazy_retry_reloaded');
      }
      return component;
    } catch (error) {
      console.warn('[lazyWithRetry] Dynamic import chunk failed:', error);

      const errorMessage = error?.message || '';
      // Only reload for genuine deployment-stale-chunk errors, NOT generic network blips.
      // Notably: 'import' alone is too broad — it matches any import-related error.
      const isChunkOrModuleError =
        error?.name === 'ChunkLoadError' ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Expected a JavaScript-or-Wasm module script') ||
        errorMessage.includes('MIME type') ||
        errorMessage.includes('Loading chunk');

      const now = Date.now();
      const reloadDebounceOk = now - lastReloadTime >= RELOAD_DEBOUNCE_MS;

      if (!pageHasAlreadyBeenReloaded && isChunkOrModuleError && reloadDebounceOk) {
        console.warn('[lazyWithRetry] Refreshing page to load latest deployed app bundle...');
        lastReloadTime = now;
        sessionStorage.setItem('lazy_retry_reloaded', 'true');
        window.location.reload();
        // Return pending promise so React Suspense doesn't crash during reload
        return new Promise(() => {});
      }

      throw error;
    }
  });
}

export default lazyWithRetry;
