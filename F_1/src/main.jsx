import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { RouterProvider } from './context/RouterContext'
import { LoadingProvider } from './context/LoadingContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </RouterProvider>
    </AuthProvider>
  </StrictMode>,
)
