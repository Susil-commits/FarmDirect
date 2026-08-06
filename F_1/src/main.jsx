import './utils/localStoragePatch.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { RouterProvider } from './context/RouterContext'
import { LoadingProvider } from './context/LoadingContext'
import { SocketProvider } from './context/SocketContext'

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