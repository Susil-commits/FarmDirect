import './utils/localStoragePatch.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // i18n initialization
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { RouterProvider } from './context/RouterContext'
import { LoadingProvider } from './context/LoadingContext'
import { SocketProvider } from './context/SocketContext'

// Track whether the page has completed a successful load — used to skip
// the vite preload-error reload if we've already hydrated successfully.
let pageLoadedSuccessfully = false;
window.addEventListener('load', () => {
  pageLoadedSuccessfully = true;
  // Clear reload flags ONLY after a confirmed successful load — prevents
  // the guard from being wiped before it can stop a cascade of reloads.
  try {
    sessionStorage.removeItem('vite_preload_reloaded');
    sessionStorage.removeItem('lazy_retry_reloaded');
  } catch {
    // Ignore storage restrictions
  }
});

// Vite Dynamic Preload Error Listener (catches stale chunk hashes after deployments)
window.addEventListener('vite:preload-error', (event) => {
  // If the page has already loaded successfully, stale-chunk errors are harmless — skip reload.
  if (pageLoadedSuccessfully) return;

  console.warn('[Vite] Preload error detected for dynamic asset. Auto-refreshing page...', event);
  event.preventDefault();
  const pageHasAlreadyBeenReloaded = sessionStorage.getItem('vite_preload_reloaded') === 'true';
  if (!pageHasAlreadyBeenReloaded) {
    sessionStorage.setItem('vite_preload_reloaded', 'true');
    window.location.reload();
  }
});

// Global Error Boundaries to prevent total app crashes from unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled Promise Rejection caught globally:', event.reason);
  event.preventDefault(); // Prevent standard console red-text if handled
});

window.onerror = function(message, source, lineno, colno, error) {
  console.warn('Global UI Error caught:', { message, source, lineno, colno, error });
  // Prevents the browser from terminating the entire JS context in some edge cases
  return true; 
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider>
        <LoadingProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </LoadingProvider>
      </RouterProvider>
    </AuthProvider>
  </StrictMode>,
)