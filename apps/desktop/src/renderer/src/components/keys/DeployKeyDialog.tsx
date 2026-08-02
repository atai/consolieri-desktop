import { useEffect, useState } from 'react'
import type { AssignableHost, SshKeyInfo } from '@shared/types'

interface DeployKeyDialogProps {
  keyInfo: SshKeyInfo
  onClose: () => void
}

function newLogId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export function DeployKeyDialog({ keyInfo, onClose }: DeployKeyDialogProps): React.JSX.Element {
  const [hosts, setHosts] = useState<AssignableHost[]>([])
  const [hostId, setHostId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [deployPassword, setDeployPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [openLog, setOpenLog] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; logId?: string } | null>(
    null
  )

  useEffect(() => {
    window.consoleri.keys.listAssignableHosts().then((list) => {
      setHosts(list)
      if (list.length > 0) {
        setHostId(list[0].hostId)
        setProfileId(list[0].profiles[0]?.profileId ?? '')
      }
    })
  }, [])

  const selectedHost = hosts.find((h) => h.hostId === hostId)
  const profiles = selectedHost?.profiles ?? []
  const selectedProfile = profiles.find((p) => p.profileId === profileId)

  useEffect(() => {
    if (profiles.length > 0 && !profiles.some((p) => p.profileId === profileId)) {
      setProfileId(profiles[0].profileId)
    }
  }, [hostId, profiles, profileId])

  useEffect(() => {
    if (!selectedProfile) {
      setNeedsPassword(true)
      return
    }
    const hasAuth = Boolean(selectedProfile.credentialRef)
    setNeedsPassword(!hasAuth)
  }, [selectedProfile])

  const handleDeploy = async (): Promise<void> => {
    setDeploying(true)
    setResult(null)
    const logId = newLogId()

    try {
      const res = await window.consoleri.keys.deploy({
        hostId,
        profileId: profileId || undefined,
        keyPath: keyInfo.privateKeyPath,
        deployPassword: deployPassword || undefined,
        logId,
        openLog
      })
      setResult(res)
    } catch (e) {
      setResult({ success: false, message: e instanceof Error ? e.message : String(e), logId })
    } finally {
      setDeploying(false)
    }
  }

  const handleOpenLog = (): void => {
    if (result?.logId) {
      void window.consoleri.sessions.openLogWindow(result.logId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-4 shadow-xl">
        <h3 className="mb-3 text-base font-medium text-fg">Deploy public key</h3>
        <p className="mb-1 truncate text-xs text-muted">{keyInfo.label}</p>
        <p className="mb-3 text-xs text-muted">
          Appends the public key to <code className="text-muted">~/.ssh/authorized_keys</code> on the
          remote host.
        </p>

        {hosts.length === 0 ? (
          <p className="mb-4 text-sm text-muted">No hosts with SSH profiles.</p>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-muted">Host</span>
              <select
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                value={hostId}
                onChange={(e) => setHostId(e.target.value)}
                disabled={deploying}
              >
                {hosts.map((h) => (
                  <option key={h.hostId} value={h.hostId}>
                    {h.hostName} ({h.hostname})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">SSH profile (for connection)</span>
              <select
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                disabled={deploying}
              >
                {profiles.map((p) => (
                  <option key={p.profileId} value={p.profileId}>
                    {p.profileName}
                    {p.username ? ` (${p.username})` : ''}
                  </option>
                ))}
              </select>
            </label>
            {needsPassword && (
              <label className="block text-sm">
                <span className="text-muted">Password for SSH login</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                  value={deployPassword}
                  onChange={(e) => setDeployPassword(e.target.value)}
                  placeholder="Required if profile has no credentials"
                  disabled={deploying}
                />
              </label>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={openLog}
                onChange={(e) => setOpenLog(e.target.checked)}
                disabled={deploying}
              />
              Open deploy log
            </label>
          </div>
        )}

        {result && (
          <div className="mt-3 space-y-2">
            <p className={`text-xs ${result.success ? 'text-success' : 'text-danger'}`}>
              {result.message}
            </p>
            {result.logId && (
              <button
                type="button"
                onClick={handleOpenLog}
                className="text-xs text-accent hover:underline"
              >
                View deploy log
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deploying}
            className="rounded px-3 py-1.5 text-sm text-muted hover:bg-surface-raised disabled:opacity-50"
          >
            {result?.success ? 'Close' : 'Cancel'}
          </button>
          {!result?.success && (
            <button
              type="button"
              disabled={deploying || !hostId || (needsPassword && !deployPassword)}
              onClick={handleDeploy}
              className="rounded bg-accent px-3 py-1.5 text-sm text-accent-on hover:bg-accent-hover disabled:opacity-50"
            >
              {deploying ? 'Deploying…' : 'Deploy'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
