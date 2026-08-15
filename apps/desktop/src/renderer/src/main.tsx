import './assets/app.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { RendererErrorBoundary } from './components/ui/RendererErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RendererErrorBoundary title="Consoleri crashed">
      <App />
    </RendererErrorBoundary>
  </StrictMode>
)
