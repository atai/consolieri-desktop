import { useState } from 'react'
import type { CloudBackupInfo, CloudStatus } from '@shared/types'
import { useIpcQuery } from '../../hooks/useIpcQuery'
import { Button } from '../ui/Button'
import { InlineConfirmButton } from '../ui/InlineConfirmButton'
import { CloudRecoveryKeyModal, type CloudRecoveryKeyMode } from './CloudRecoveryKeyModal'

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface CloudPanelData {
  status: CloudStatus | null
  backups: CloudBackupInfo[]
}

async function loadCloudPanelData(): Promise<CloudPanelData> {
  const status = await window.consoleri.cloud.getStatus()
  if (!status.signedIn) {
    return { status, backups: [] }
  }
  try {
    const backups = await window.consoleri.cloud.listBackups()
    return { status, backups }
  } catch {
    return { status, backups: [] }
  }
}

export function CloudSettingsPanel(): React.JSX.Element {
  const {
    data: { status, backups },
    loading,
    refresh,
    setData
  } = useIpcQuery(loadCloudPanelData, 'cloud-settings', {
    status: null,
    backups: []
  } satisfies CloudPanelData)
  const [busy, setBusy] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null)
  const [recoveryModal, setRecoveryModal] = useState<{
    mode: CloudRecoveryKeyMode
    key?: string
  } | null>(null)

  const setStatus = (next: CloudStatus): void => {
    setData((prev) => ({ ...prev, status: next }))
  }

  const setBackups = (
    updater: CloudBackupInfo[] | ((prev: CloudBackupInfo[]) => CloudBackupInfo[])
  ): void => {
    setData((prev) => ({
      ...prev,
      backups: typeof updater === 'function' ? updater(prev.backups) : updater
    }))
  }

  const handleLogin = async (): Promise<void> => {
    setBusy(true)
    setMessage(null)
    try {
      const result = await window.consoleri.cloud.login()
      setStatus(result.status)
      if (result.syncKeyCreated) {
        const key = await window.consoleri.cloud.exportRecoveryKey()
        setRecoveryModal({ mode: 'export', key })
      }
      await refresh()
      setMessage({ text: 'Connected to Consolieri Cloud', kind: 'ok' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), kind: 'err' })
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    setBusy(true)
    setMessage(null)
    try {
      const next = await window.consoleri.cloud.logout()
      setStatus(next)
      setBackups([])
      setMessage({ text: 'Signed out. Local data and sync key were kept.', kind: 'ok' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), kind: 'err' })
    } finally {
      setBusy(false)
    }
  }

  const handleToggleEnabled = async (): Promise<void> => {
    if (!status) return
    const next = await window.consoleri.cloud.updateSettings({ enabled: !status.enabled })
    setStatus({ ...status, enabled: next.enabled })
  }

  const handleBackupNow = async (): Promise<void> => {
    setBusy(true)
    setMessage(null)
    try {
      const item = await window.consoleri.cloud.backupNow()
      setBackups((prev) => [item, ...prev.filter((b) => b.id !== item.id)])
      await refresh()
      setMessage({ text: 'Cloud backup uploaded', kind: 'ok' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), kind: 'err' })
    } finally {
      setBusy(false)
    }
  }

  const handleRestore = async (id: string): Promise<void> => {
    if (
      !confirm(
        'Restore this cloud backup? All current settings and hosts will be replaced. This cannot be undone.'
      )
    ) {
      return
    }
    setRestoring(id)
    setMessage(null)
    try {
      await window.consoleri.cloud.restoreBackup(id)
      setMessage({ text: 'Restore complete. Reload the app to see changes.', kind: 'ok' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), kind: 'err' })
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    await window.consoleri.cloud.deleteBackup(id)
    setBackups((prev) => prev.filter((b) => b.id !== id))
  }

  const handleShowRecoveryKey = async (): Promise<void> => {
    setMessage(null)
    try {
      const key = await window.consoleri.cloud.exportRecoveryKey()
      setRecoveryModal({ mode: 'export', key })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : String(err), kind: 'err' })
    }
  }

  const handleClearSyncKey = async (): Promise<void> => {
    await window.consoleri.cloud.clearSyncKey()
    await refresh()
    setMessage({
      text: 'Sync key removed. Existing cloud backups can no longer be decrypted on this device.',
      kind: 'ok'
    })
  }

  if (loading || !status) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">Loading…</div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="max-w-2xl space-y-8 p-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">Account</h2>
          <p className="text-xs text-muted">
            Optional cloud sync. Your settings and passwords are end-to-end encrypted — the API
            never sees plaintext secrets.
          </p>
          <div className="rounded border border-border bg-bg px-3 py-2 text-xs text-muted">
            {status.signedIn ? `Signed in as ${status.email ?? 'unknown'}` : 'Not connected'}
            {status.hasSyncKey ? ' · Sync key stored' : ' · No sync key'}
          </div>
          <div className="flex flex-wrap gap-2">
            {!status.signedIn ? (
              <Button
                variant="primary"
                size="md"
                disabled={busy}
                onClick={() => void handleLogin()}
              >
                {busy ? 'Connecting…' : 'Connect account'}
              </Button>
            ) : (
              <Button
                variant="default"
                size="md"
                disabled={busy}
                onClick={() => void handleLogout()}
              >
                Sign out
              </Button>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">Sync key</h2>
          <p className="text-xs text-muted">
            The recovery key decrypts cloud backups on other devices. Sign-out keeps the key on this
            machine.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              disabled={!status.hasSyncKey}
              onClick={() => void handleShowRecoveryKey()}
            >
              Show recovery key
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setRecoveryModal({ mode: 'import' })}
            >
              Import recovery key…
            </Button>
            {status.hasSyncKey && (
              <InlineConfirmButton
                label="Remove sync key"
                confirmLabel="Remove"
                variant="danger"
                size="sm"
                onConfirm={handleClearSyncKey}
              />
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold text-fg">Cloud sync</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg">Enable automatic cloud backups</p>
              <p className="text-xs text-muted">
                Uploads an encrypted backup shortly after settings change (when signed in)
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={status.enabled}
              onClick={() => void handleToggleEnabled()}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                status.enabled ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  status.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="md"
              disabled={busy || !status.signedIn || !status.hasSyncKey}
              onClick={() => void handleBackupNow()}
            >
              {busy ? 'Uploading…' : 'Backup now'}
            </Button>
          </div>
          {status.lastUploadAt && (
            <p className="text-xs text-muted">Last upload: {formatDate(status.lastUploadAt)}</p>
          )}
          {status.lastError && (
            <p className="text-xs text-danger">Last error: {status.lastError}</p>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">
              Cloud backups
              {backups.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted">({backups.length})</span>
              )}
            </h2>
            <Button
              variant="default"
              size="sm"
              onClick={() => void refresh()}
              disabled={!status.signedIn}
            >
              Refresh
            </Button>
          </div>

          {!status.signedIn ? (
            <p className="text-sm text-muted">Sign in to view cloud backups.</p>
          ) : backups.length === 0 ? (
            <p className="text-sm text-muted">No cloud backups yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded border border-border">
              {backups.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <p className="text-fg">{formatDate(b.createdAt)}</p>
                    <p className="text-xs text-muted">
                      {formatBytes(b.byteSize)}
                      {b.label ? ` · ${b.label}` : ''}
                      {b.deviceId ? ` · device ${b.deviceId.slice(0, 8)}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={restoring === b.id || !status.hasSyncKey}
                      onClick={() => void handleRestore(b.id)}
                    >
                      {restoring === b.id ? 'Restoring…' : 'Restore'}
                    </Button>
                    <InlineConfirmButton
                      label="Delete"
                      confirmLabel="Delete"
                      variant="danger"
                      size="sm"
                      onConfirm={() => handleDelete(b.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {message && (
          <p className={`text-xs ${message.kind === 'ok' ? 'text-success' : 'text-danger'}`}>
            {message.text}
          </p>
        )}
      </div>

      {recoveryModal && (
        <CloudRecoveryKeyModal
          mode={recoveryModal.mode}
          recoveryKey={recoveryModal.key}
          onClose={() => setRecoveryModal(null)}
          onImported={() => void refresh()}
        />
      )}
    </div>
  )
}
