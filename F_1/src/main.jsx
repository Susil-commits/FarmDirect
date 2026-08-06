import './utils/localStoragePatch.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { RouterProvider } from './context/RouterContext'
import { LoadingProvider } from './context/LoadingContext'
import { SocketProvider } from './context/SocketContext'

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