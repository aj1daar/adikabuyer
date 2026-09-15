import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import SiteToaster from './components/SiteToaster.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SiteToaster />
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
