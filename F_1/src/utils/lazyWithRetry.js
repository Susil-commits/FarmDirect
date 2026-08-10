import { lazy } from 'react';

/**
 * Robust lazy loading wrapper with auto-retry and cache-busting logic.
 * Solves "Failed to fetch dynamically imported module" / MIME type "text/html" errors
 * caused by deployment hash changes, stale Service Worker caches, or temporary network drops.
 *
 * @param {Function} componentImport Function returning dynamic import promise, e.g. () => import('./MyComponent')
 * @returns {React.LazyExoticComponent}
 */
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
      const isChunkOrModuleError =
        error?.name === 'ChunkLoadError' ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Expected a JavaScript-or-Wasm module script') ||
        errorMessage.includes('MIME type') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('import');

      if (!pageHasAlreadyBeenReloaded && isChunkOrModuleError) {
        console.warn('[lazyWithRetry] Refreshing page to load latest deployed app bundle...');
        sessionStorage.setItem('lazy_retry_reloaded', 'true');
        // Force reload from server, bypassing cache if supported
        window.location.reload();
        // Return pending promise so React Suspense doesn't crash during reload
        return new Promise(() => {});
      }

      throw error;
    }
  });
}

export default lazyWithRetry;
