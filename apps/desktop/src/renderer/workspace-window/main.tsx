import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WorkspaceWindowApp } from './App'
import '../src/assets/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkspaceWindowApp />
  </StrictMode>
)
