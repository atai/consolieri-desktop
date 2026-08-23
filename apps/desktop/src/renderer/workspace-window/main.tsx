import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WorkspaceWindowApp } from './App'
import { RendererErrorBoundary } from '../src/components/ui/RendererErrorBoundary'
import '../src/assets/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RendererErrorBoundary title="Workspace window crashed">
      <WorkspaceWindowApp />
    </RendererErrorBoundary>
  </StrictMode>
)
