import { lazy } from 'react';

const RELOAD_DEBOUNCE_MS = 8000;
let lastReloadTime = 0;

export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasAlreadyBeenReloaded = sessionStorage.getItem('lazy_retry_reloaded') === 'true';

    try {
      const component = await componentImport();
      
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
        errorMessage.includes('Loading chunk');

      const now = Date.now();
      const reloadDebounceOk = now - lastReloadTime >= RELOAD_DEBOUNCE_MS;

      if (!pageHasAlreadyBeenReloaded && isChunkOrModuleError && reloadDebounceOk) {
        console.warn('[lazyWithRetry] Refreshing page to load latest deployed app bundle...');
        lastReloadTime = now;
        sessionStorage.setItem('lazy_retry_reloaded', 'true');
        window.location.reload();
        
        return new Promise(() => {});
      }

      throw error;
    }
  });
}

export default lazyWithRetry;
