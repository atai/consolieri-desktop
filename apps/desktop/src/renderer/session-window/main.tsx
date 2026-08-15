import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SessionWindowApp } from './App'
import { RendererErrorBoundary } from '../src/components/ui/RendererErrorBoundary'
import '../src/assets/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RendererErrorBoundary title="Session window crashed">
      <SessionWindowApp />
    </RendererErrorBoundary>
  </StrictMode>
)
