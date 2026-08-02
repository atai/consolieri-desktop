import { useState } from 'react'
import type { Host, UxProfile } from '@shared/types'
import { useIpcQuery } from '../../hooks/useIpcQuery'
import { useUxProfileStore } from '../../stores/uxProfileStore'
import { UxProfileForm } from './UxProfileForm'
import { UxProfileListItem } from './UxProfileListItem'
import { PickUxProfileDialog } from './PickUxProfileDialog'

interface UxProfileManagerData {
  hosts: Host[]
  profiles: UxProfile[]
  profileHosts: Map<string, Host[]>
}

const EMPTY_UX_DATA: UxProfileManagerData = {
  hosts: [],
  profiles: [],
  profileHosts: new Map()
}

async function loadUxProfileManagerData(
  hostFilter: string,
  refreshUxProfiles: () => Promise<void>
): Promise<UxProfileManagerData> {
  const hostList = await window.consoleri.hosts.list()
  const profileList = hostFilter
    ? await window.consoleri.uxProfiles.list(hostFilter)
    : await window.consoleri.uxProfiles.list()

  const hostMap = new Map<string, Host[]>()
  const allProfiles = await window.consoleri.uxProfiles.list()
  await Promise.all(
    allProfiles.map(async (profile) => {
      hostMap.set(profile.id, await window.consoleri.uxProfiles.listHosts(profile.id))
    })
  )
  await refreshUxProfiles()
  return { hosts: hostList, profiles: profileList, profileHosts: hostMap }
}

export function UxProfileManager(): React.JSX.Element {
  const activeId = useUxProfileStore((s) => s.activeId)
  const setActive = useUxProfileStore((s) => s.setActive)
  const refreshUxProfiles = useUxProfileStore((s) => s.refresh)

  const [hostFilter, setHostFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPickDialog, setShowPickDialog] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)

  const {
    data: { hosts, profiles, profileHosts },
    loading,
    refresh
  } = useIpcQuery(
    () => loadUxProfileManagerData(hostFilter, refreshUxProfiles),
    hostFilter || '__all__',
    EMPTY_UX_DATA
  )

  const hostById = new Map(hosts.map((h) => [h.id, h]))

  const handleDelete = async (profile: UxProfile): Promise<void> => {
    await window.consoleri.uxProfiles.delete(profile.id)
    await refresh()
  }

  const handleUnlink = async (hostId: string): Promise<void> => {
    await window.consoleri.uxProfiles.unlinkHost(hostId)
    await refresh()
  }

  const handlePick = async (profile: UxProfile): Promise<void> => {
    if (!hostFilter) return
    await window.consoleri.uxProfiles.linkHost(hostFilter, profile.id)
    await refresh()
  }

  const handleSaved = async (): Promise<void> => {
    setShowAddForm(false)
    setEditingProfileId(null)
    await refresh()
  }

  const renderProfile = (profile: UxProfile): React.JSX.Element => {
    const filterHost = hostFilter ? hostById.get(hostFilter) : undefined
    const linkedHosts = profileHosts.get(profile.id) ?? []

    if (editingProfileId === profile.id) {
      return (
        <li key={profile.id} className="border-b border-border bg-bg">
          <UxProfileForm
            profile={profile}
            onSave={() => void handleSaved()}
            onCancel={() => setEditingProfileId(null)}
          />
        </li>
      )
    }

    return (
      <UxProfileListItem
        key={profile.id}
        profile={profile}
        host={filterHost}
        linkedHosts={linkedHosts}
        isActive={activeId === profile.id}
        onSetActive={() => void setActive(profile.id).then(() => refresh())}
        onEdit={() => setEditingProfileId(profile.id)}
        onDelete={() => handleDelete(profile)}
        onUnlink={
          hostFilter && filterHost?.uxProfileId === profile.id
            ? () => handleUnlink(hostFilter)
            : undefined
        }
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <div className="shrink-0 border-b border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-fg">Appearance</h1>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-surface-raised"
          >
            Refresh
          </button>
        </div>
        <p className="text-xs text-muted">Visual presets for terminal and sidebar</p>
      </div>

      <div className="shrink-0 space-y-2 border-b border-border p-2">
        <label className="block text-sm">
          <span className="text-muted">Host filter</span>
          <select
            className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value)}
          >
            <option value="">All profiles</option>
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.hostname})
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hostFilter || showAddForm}
            onClick={() => setShowPickDialog(true)}
            className="flex-1 rounded border border-border px-2 py-1.5 text-xs text-fg-2 hover:bg-surface-raised disabled:opacity-50"
          >
            + Link to host
          </button>
          <button
            type="button"
            disabled={showAddForm}
            onClick={() => setShowAddForm(true)}
            className="flex-1 rounded bg-accent px-2 py-1.5 text-xs text-accent-on hover:bg-accent-hover disabled:opacity-50"
          >
            + Add profile
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="shrink-0 border-b border-border bg-bg">
          <UxProfileForm onSave={() => void handleSaved()} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {showPickDialog && hostFilter && (
        <PickUxProfileDialog
          targetHostId={hostFilter}
          onClose={() => setShowPickDialog(false)}
          onPick={handlePick}
        />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-center text-sm text-muted">Loading profiles…</p>
        ) : profiles.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted">No appearance profiles yet</p>
        ) : (
          <ul>{profiles.map((p) => renderProfile(p))}</ul>
        )}
      </div>
    </div>
  )
}
