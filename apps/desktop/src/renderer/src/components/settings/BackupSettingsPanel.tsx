import { useState } from 'react'
import type { BackupInfo, BackupSettings } from '@shared/types'
import { useIpcQuery } from '../../hooks/useIpcQuery'

const INTERVAL_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 }
]

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

interface BackupPanelData {
  settings: BackupSettings | null
  backups: BackupInfo[]
}

async function loadBackupPanelData(): Promise<BackupPanelData> {
  const [settings, backups] = await Promise.all([
    window.consoleri.backup.getSettings(),
    window.consoleri.backup.list()
  ])
  return { settings, backups }
}

export function BackupSettingsPanel(): React.JSX.Element {
  const {
    data: { settings, backups },
    loading,
    refresh,
    setData
  } = useIpcQuery(loadBackupPanelData, 'backup-settings', {
    settings: null,
    backups: []
  } satisfies BackupPanelData)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null)

  const setSettings = (next: BackupSettings): void => {
    setData((prev) => ({ ...prev, settings: next }))
  }

  const setBackups = (updater: BackupInfo[] | ((prev: BackupInfo[]) => BackupInfo[])): void => {
    setData((prev) => ({
      ...prev,
      backups: typeof updater === 'function' ? updater(prev.backups) : updater
    }))
  }

  const applyPatch = async (patch: Partial<BackupSettings>): Promise<void> => {
    const next = await window.consoleri.backup.updateSettings(patch)
    setSettings(next)
  }

  const handleCreateNow = async (): Promise<void> => {
    setCreating(true)
    setMessage(null)
    try {
      const info = await window.consoleri.backup.createNow()
      setBackups((prev) => [info, ...prev])
      setMessage({ text: `Backup created: ${info.filename}`, kind: 'ok' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Backup failed', kind: 'err' })
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (id: string): Promise<void> => {
    if (
      !confirm(
        'Restore this backup? All current settings and hosts will be replaced. This cannot be undone.'
      )
    )
      return
    setRestoring(id)
    setMessage(null)
    try {
      await window.consoleri.backup.restore(id)
      setMessage({ text: 'Restore complete. Reload the app to see changes.', kind: 'ok' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Restore failed', kind: 'err' })
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this backup file?')) return
    await window.consoleri.backup.delete(id)
    setBackups((prev) => prev.filter((b) => b.id !== id))
  }

  const handleExportFull = async (): Promise<void> => {
    setMessage(null)
    try {
      const result = await window.consoleri.app.exportToFile()
      if ('path' in result) {
        setMessage({ text: `Exported to ${result.path}`, kind: 'ok' })
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Export failed', kind: 'err' })
    }
  }

  const handleImportFull = async (): Promise<void> => {
    if (!confirm('Import a full settings file? All current settings and hosts will be replaced.'))
      return
    setMessage(null)
    try {
      await window.consoleri.app.importFromFile()
      setMessage({ text: 'Import complete. Reload the app to see changes.', kind: 'ok' })
      await refresh()
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Import failed', kind: 'err' })
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">Loading…</div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="max-w-2xl space-y-8 p-6">
        {/* Auto-backup settings */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-fg">Automatic backups</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg">Enable automatic backups</p>
              <p className="text-xs text-muted">
                Saves a full backup on a schedule to the backups folder
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              onClick={() => void applyPatch({ enabled: !settings.enabled })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                settings.enabled ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings.enabled && (
            <>
              <div>
                <p className="mb-2 text-sm text-fg">Backup interval</p>
                <div className="flex gap-2">
                  {INTERVAL_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => void applyPatch({ intervalMinutes: preset.value })}
                      className={`rounded border px-3 py-1 text-xs ${
                        settings.intervalMinutes === preset.value
                          ? 'border-accent bg-accent text-accent-on'
                          : 'border-border text-muted hover:bg-surface-raised hover:text-fg'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      max={10080}
                      value={settings.intervalMinutes}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (!isNaN(v) && v >= 5) void applyPatch({ intervalMinutes: v })
                      }}
                      className="w-16 rounded border border-border bg-bg px-2 py-1 text-xs text-fg"
                    />
                    <span className="text-xs text-muted">min</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm text-fg">Keep versions</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.maxCount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 1) void applyPatch({ maxCount: v })
                    }}
                    className="w-16 rounded border border-border bg-bg px-2 py-1 text-xs text-fg"
                  />
                  <span className="text-xs text-muted">
                    oldest backups are deleted automatically
                  </span>
                </div>
              </div>

              {settings.lastBackupAt && (
                <p className="text-xs text-muted">
                  Last backup: {formatDate(settings.lastBackupAt)}
                </p>
              )}
            </>
          )}
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">Manual actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreateNow()}
              className="rounded bg-accent px-3 py-1.5 text-sm text-accent-on hover:bg-accent-hover disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create backup now'}
            </button>
            <button
              type="button"
              onClick={() => void handleExportFull()}
              className="rounded border border-border px-3 py-1.5 text-sm text-fg-2 hover:bg-surface-raised"
            >
              Export full settings…
            </button>
            <button
              type="button"
              onClick={() => void handleImportFull()}
              className="rounded border border-border px-3 py-1.5 text-sm text-fg-2 hover:bg-surface-raised"
            >
              Import full settings…
            </button>
            <button
              type="button"
              onClick={() => void window.consoleri.backup.openFolder()}
              className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-surface-raised hover:text-fg"
            >
              Open backups folder
            </button>
          </div>
          {message && (
            <p className={`text-xs ${message.kind === 'ok' ? 'text-success' : 'text-danger'}`}>
              {message.text}
            </p>
          )}
          <p className="text-xs text-muted">
            Secrets (Vault tokens, local passwords) are included in backups using OS-level
            encryption. They can only be restored on the same computer and OS user account.
          </p>
        </section>

        {/* Backup list */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">
              Saved backups
              {backups.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted">({backups.length})</span>
              )}
            </h2>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-surface-raised"
            >
              Refresh
            </button>
          </div>

          {backups.length === 0 ? (
            <p className="text-sm text-muted">No backups yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded border border-border">
              {backups.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <p className="text-fg">{formatDate(b.createdAt)}</p>
                    <p className="text-xs text-muted">
                      {b.filename} · {formatBytes(b.sizeBytes)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={restoring === b.id}
                      onClick={() => void handleRestore(b.id)}
                      className="rounded border border-border px-2 py-0.5 text-xs text-fg-2 hover:bg-surface-raised disabled:opacity-50"
                    >
                      {restoring === b.id ? 'Restoring…' : 'Restore'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(b.id)}
                      className="rounded border border-border px-2 py-0.5 text-xs text-danger hover:bg-surface-raised"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
