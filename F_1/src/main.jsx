import './utils/localStoragePatch.js'

// Clean up any legacy Service Worker from PWA to prevent cached stale bundles
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' 
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { RouterProvider } from './context/RouterContext'
import { LoadingProvider } from './context/LoadingContext'
import { SocketProvider } from './context/SocketContext'

let pageLoadedSuccessfully = false;
window.addEventListener('load', () => {
  pageLoadedSuccessfully = true;
  
  try {
    sessionStorage.removeItem('vite_preload_reloaded');
    sessionStorage.removeItem('lazy_retry_reloaded');
  } catch {
    
  }
});

window.addEventListener('vite:preload-error', (event) => {
  
  if (pageLoadedSuccessfully) return;

  console.warn('[Vite] Preload error detected for dynamic asset. Auto-refreshing page...', event);
  event.preventDefault();
  const pageHasAlreadyBeenReloaded = sessionStorage.getItem('vite_preload_reloaded') === 'true';
  if (!pageHasAlreadyBeenReloaded) {
    sessionStorage.setItem('vite_preload_reloaded', 'true');
    window.location.reload();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled Promise Rejection caught globally:', event.reason);
  event.preventDefault(); 
});

window.onerror = function(message, source, lineno, colno, error) {
  console.warn('Global UI Error caught:', { message, source, lineno, colno, error });
  
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