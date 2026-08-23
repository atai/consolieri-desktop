import { useEffect, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { ControlConfirmDialog } from './components/settings/ControlConfirmDialog'
import { useAppStore } from './stores/appStore'
import { useSessionWorkspaceStore } from './stores/sessionWorkspaceStore'
import { useUxProfileStore } from './stores/uxProfileStore'
import type { ControlConfirmRequest } from '@shared/types'
import './assets/app.css'

function App(): React.JSX.Element {
  const { refreshHosts } = useAppStore()
  const { setWorkspace } = useSessionWorkspaceStore()
  const refreshUxProfiles = useUxProfileStore((s) => s.refresh)
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [confirmRequest, setConfirmRequest] = useState<ControlConfirmRequest | null>(null)

  useEffect(() => {
    void refreshHosts()
    void refreshUxProfiles()
  }, [refreshHosts, refreshUxProfiles])

  useEffect(() => {
    window.consoleri.workspace.load().then((ws) => {
      if (ws) setWorkspace(ws)
      setWorkspaceReady(true)
    })
  }, [setWorkspace])

  useEffect(() => {
    return window.consoleri.control.onConfirmRequest((request) => {
      setConfirmRequest(request)
    })
  }, [])

  return (
    <>
      <AppShell workspaceReady={workspaceReady} />
      {confirmRequest && (
        <ControlConfirmDialog
          request={confirmRequest}
          onDecide={(decision) => {
            const requestId = confirmRequest.requestId
            setConfirmRequest(null)
            void window.consoleri.control.respondConfirm(requestId, decision)
          }}
        />
      )}
    </>
  )
}

export default App
