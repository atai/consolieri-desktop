import { useEffect, useState } from 'react'
import type { AssignableHost, SshKeyInfo } from '@shared/types'

interface AssignKeyDialogProps {
  keyInfo: SshKeyInfo
  onClose: () => void
  onAssigned: () => void
}

export function AssignKeyDialog({
  keyInfo,
  onClose,
  onAssigned
}: AssignKeyDialogProps): React.JSX.Element {
  const [hosts, setHosts] = useState<AssignableHost[]>([])
  const [hostId, setHostId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (profiles.length > 0 && !profiles.some((p) => p.profileId === profileId)) {
      setProfileId(profiles[0].profileId)
    }
  }, [hostId, profiles, profileId])

  const handleAssign = async (): Promise<void> => {
    if (!profileId) return
    setSaving(true)
    setError(null)
    try {
      await window.consoleri.keys.assign(profileId, keyInfo.privateKeyPath)
      onAssigned()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-4 shadow-xl">
        <h3 className="mb-3 text-base font-medium text-fg">Assign key to host</h3>
        <p className="mb-3 truncate text-xs text-muted">{keyInfo.label}</p>

        {hosts.length === 0 ? (
          <p className="mb-4 text-sm text-muted">No hosts with SSH profiles. Add a host first.</p>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="text-muted">Host</span>
              <select
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                value={hostId}
                onChange={(e) => setHostId(e.target.value)}
              >
                {hosts.map((h) => (
                  <option key={h.hostId} value={h.hostId}>
                    {h.hostName} ({h.hostname})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">SSH profile</span>
              <select
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.profileId} value={p.profileId}>
                    {p.profileName}
                    {p.username ? ` (${p.username})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-muted hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !profileId}
            onClick={handleAssign}
            className="rounded bg-accent px-3 py-1.5 text-sm text-accent-on hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}
