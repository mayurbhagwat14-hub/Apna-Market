import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  const cachedBranding = localStorage.getItem('app_branding');
  if (
    cachedBranding &&
    (cachedBranding.toLowerCase().includes('zevy') ||
      cachedBranding.toLowerCase().includes('zevgo') ||
      cachedBranding.toLowerCase().includes('appzeto'))
  ) {
    localStorage.removeItem('app_branding');
  }
} catch {
  /* ignore */
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
