import { useEffect, useState } from 'react'
import type { ConnectionProfile, Host, ReportHostEntry } from '@shared/types'
import { PickHostsDialog } from './PickHostsDialog'

interface ReportHostEntriesSectionProps {
  entries: ReportHostEntry[]
  onEntriesChange: (entries: ReportHostEntry[]) => void
  disabled?: boolean
  className?: string
}

export function ReportHostEntriesSection({
  entries,
  onEntriesChange,
  disabled = false,
  className = 'mb-3'
}: ReportHostEntriesSectionProps): React.JSX.Element {
  const [hosts, setHosts] = useState<Host[]>([])
  const [profilesByHost, setProfilesByHost] = useState<Map<string, ConnectionProfile[]>>(new Map())
  const [showPickHosts, setShowPickHosts] = useState(false)

  useEffect(() => {
    void (async () => {
      const hostList = await window.consoleri.hosts.list()
      setHosts(hostList)
      const map = new Map<string, ConnectionProfile[]>()
      const hostIds = new Set(entries.map((e) => e.hostId))
      await Promise.all(
        [...hostIds].map(async (hostId) => {
          const profiles = await window.consoleri.profiles.list(hostId)
          map.set(
            hostId,
            profiles.filter((p) => p.protocol === 'ssh')
          )
        })
      )
      setProfilesByHost(map)
    })()
  }, [entries])

  const hostById = new Map(hosts.map((h) => [h.id, h]))

  const loadProfilesForHost = async (hostId: string): Promise<ConnectionProfile[]> => {
    const profiles = await window.consoleri.profiles.list(hostId)
    const sshProfiles = profiles.filter((p) => p.protocol === 'ssh')
    setProfilesByHost((prev) => new Map(prev).set(hostId, sshProfiles))
    return sshProfiles
  }

  const handleAddHosts = async (
    picked: Array<{ hostId: string; profileId: string }>
  ): Promise<void> => {
    const newEntries = [...entries]
    for (const pick of picked) {
      if (newEntries.some((e) => e.hostId === pick.hostId)) continue
      const sshProfiles = profilesByHost.get(pick.hostId) ?? (await loadProfilesForHost(pick.hostId))
      if (sshProfiles.length === 0) continue
      const profileId =
        sshProfiles.length === 1
          ? sshProfiles[0]!.id
          : (sshProfiles.find((p) => p.id === pick.profileId)?.id ?? sshProfiles[0]!.id)
      newEntries.push({ hostId: pick.hostId, profileId })
    }
    onEntriesChange(newEntries)
  }

  const handleRemove = (hostId: string): void => {
    onEntriesChange(entries.filter((e) => e.hostId !== hostId))
  }

  const handleProfileChange = (hostId: string, profileId: string): void => {
    onEntriesChange(entries.map((e) => (e.hostId === hostId ? { ...e, profileId } : e)))
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted">Hosts ({entries.length})</span>
        <button
          type="button"
          onClick={() => setShowPickHosts(true)}
          disabled={disabled}
          className="rounded border border-border px-2 py-0.5 text-xs text-fg-2 hover:bg-surface-raised"
        >
          + Add hosts
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted">No hosts added yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-2 py-1.5 font-medium">Host</th>
                <th className="px-2 py-1.5 font-medium">SSH profile</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const host = hostById.get(entry.hostId)
                const sshProfiles = profilesByHost.get(entry.hostId) ?? []
                return (
                  <tr key={entry.hostId} className="border-b border-border last:border-0">
                    <td className="px-2 py-1.5 text-fg">
                      {host?.name ?? entry.hostId}
                      {host && (
                        <span className="ml-1 text-xs text-muted">({host.hostname})</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {sshProfiles.length <= 1 ? (
                        <span className="text-muted">
                          {sshProfiles[0]?.name ?? entry.profileId}
                        </span>
                      ) : (
                        <select
                          value={entry.profileId}
                          onChange={(e) => handleProfileChange(entry.hostId, e.target.value)}
                          disabled={disabled}
                          className="w-full rounded border border-border bg-surface px-1.5 py-0.5 text-fg"
                        >
                          {sshProfiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(entry.hostId)}
                        disabled={disabled}
                        className="text-xs text-danger hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showPickHosts && (
        <PickHostsDialog
          existingHostIds={entries.map((e) => e.hostId)}
          onClose={() => setShowPickHosts(false)}
          onPick={(picked) => void handleAddHosts(picked)}
        />
      )}
    </div>
  )
}
