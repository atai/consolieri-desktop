import { useEffect, useId, useMemo, useState } from 'react'
import type {
  ConnectionProfile,
  Host,
  HostKind,
  HostLogVerbosity,
  OsType,
  ProfileInput,
  UxProfile
} from '@shared/types'
import {
  HOST_LOG_VERBOSITY_OPTIONS,
  normalizeHostInput,
  normalizeHttpEndpoint,
  parseTagsInput
} from '@consoleri/core'
import type { HostFormInput } from '@consoleri/core'
import { useAppStore } from '../../stores/appStore'
import { ProfileForm } from '../profiles/ProfileForm'
import { PickProfileDialog } from '../profiles/PickProfileDialog'
import { SCROLLABLE_FORM_MAX_HEIGHT_PANEL, ScrollableFormShell } from '../ui/ScrollableFormShell'
import { TagInput } from './TagInput'
import { HostProfilesSection } from '../profiles/HostProfilesSection'
import { hostCopyName } from './hostTemplate'
import {
  applyPendingProfiles,
  mergePickedProfiles,
  newPendingKey,
  pendingProfileLabel,
  type PendingProfile
} from './pendingProfiles'

interface HostFormProps {
  host?: Host
  copyFrom?: Host
  compact?: boolean
  initialPendingProfiles?: PendingProfile[]
  profiles?: ConnectionProfile[]
  onProfilesChanged?: () => void
  onConnect?: (host: Host, profileId?: string) => void
  onSave: () => void
  onCancel: () => void
}

const OS_OPTIONS: OsType[] = ['windows', 'linux', 'macos', 'unknown']

export function HostForm({
  host,
  copyFrom,
  compact = false,
  initialPendingProfiles,
  profiles,
  onProfilesChanged,
  onConnect,
  onSave,
  onCancel
}: HostFormProps): React.JSX.Element {
  const formId = useId()
  const { allHostTags, allHosts, refreshAllHostTags, refreshAllHosts } = useAppStore()
  const source = host ?? copyFrom
  const isCopyMode = Boolean(copyFrom)
  const [name, setName] = useState(host?.name ?? (copyFrom ? hostCopyName(copyFrom) : ''))
  const [kind, setKind] = useState<HostKind>(source?.kind ?? 'remote')
  const [hostname, setHostname] = useState(source?.hostname ?? '')
  const [httpEndpoint, setHttpEndpoint] = useState(source?.httpEndpoint ?? '')
  const [port, setPort] = useState(source?.port ?? 22)
  const [osType, setOsType] = useState<OsType>(source?.osType ?? 'linux')
  const [localShell, setLocalShell] = useState('zsh')
  const [tags, setTags] = useState(source?.tags.join(', ') ?? '')
  const [notes, setNotes] = useState(source?.notes ?? '')
  const [logVerbosity, setLogVerbosity] = useState<HostLogVerbosity>(source?.logVerbosity ?? 'info')
  const [uxProfileId, setUxProfileId] = useState(source?.uxProfileId ?? '')
  const [uxProfiles, setUxProfiles] = useState<UxProfile[]>([])
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [httpEndpointError, setHttpEndpointError] = useState<string | null>(null)
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>(
    initialPendingProfiles ?? []
  )
  const [showAddProfile, setShowAddProfile] = useState(false)
  const [showPickDialog, setShowPickDialog] = useState(false)
  const [relatedHostIds, setRelatedHostIds] = useState<string[]>(source?.relatedHostIds ?? [])
  const [gatewayHostId, setGatewayHostId] = useState(source?.gatewayHostId ?? '')

  const isLocal = kind === 'local'
  const excludeHostId = host?.id ?? copyFrom?.id
  const otherHosts = allHosts.filter((h) => h.id !== excludeHostId && h.kind !== 'local')
  const gatewayOptions = otherHosts.filter((h) => h.gatewayHostId !== excludeHostId)

  useEffect(() => {
    void window.consoleri.uxProfiles.list().then(setUxProfiles)
    void refreshAllHostTags()
    void refreshAllHosts()
  }, [refreshAllHostTags, refreshAllHosts])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setFormErrors({})
    setHttpEndpointError(null)
    let normalizedHttpEndpoint: string | null = null
    if (!isLocal) {
      try {
        normalizedHttpEndpoint = normalizeHttpEndpoint(httpEndpoint)
      } catch (err) {
        setHttpEndpointError(err instanceof Error ? err.message : String(err))
        return
      }
    }
    setSaving(true)
    try {
      const rawHostInput: HostFormInput = {
        name,
        hostname: isLocal ? 'localhost' : hostname,
        port: isLocal ? 0 : port,
        osType: isLocal ? (localShell === 'powershell' || localShell === 'pwsh' || localShell === 'cmd' ? 'windows' : 'macos') : osType,
        kind,
        tags: parseTagsInput(tags),
        notes,
        logVerbosity,
        uxProfileId: uxProfileId || null,
        relatedHostIds: isLocal ? [] : relatedHostIds,
        gatewayHostId: isLocal ? null : gatewayHostId || null,
        httpEndpoint: isLocal ? null : normalizedHttpEndpoint,
        groupId: copyFrom?.groupId ?? null
      }

      const { errors: hostErrors, normalized: normalizedHost } = normalizeHostInput(rawHostInput)
      if (!normalizedHost) {
        setFormErrors(hostErrors)
        return
      }

      if (host) {
        await window.consoleri.hosts.update(host.id, normalizedHost)
      } else {
        const savedHost = await window.consoleri.hosts.create(normalizedHost)
        if (isLocal) {
          const profile = await window.consoleri.profiles.create({
            name: localShell,
            protocol: localShell === 'wsl' ? 'wsl' : 'local_pty',
            shell: localShell,
            authMethod: 'none',
            linkHostId: savedHost.id
          })
          await window.consoleri.hosts.update(savedHost.id, { defaultProfileId: profile.id })
        } else {
          await applyPendingProfiles(pendingProfiles, savedHost.id)

          const sourceDefaultProfileId = copyFrom?.defaultProfileId
          if (sourceDefaultProfileId) {
            const linkedProfileIds = new Set(
              pendingProfiles.flatMap((p) => (p.kind === 'picked' ? [p.profile.id] : []))
            )
            if (linkedProfileIds.has(sourceDefaultProfileId)) {
              await window.consoleri.hosts.update(savedHost.id, {
                defaultProfileId: sourceDefaultProfileId
              })
            }
          }
        }
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  const handleDraftProfile = (input: ProfileInput): void => {
    setPendingProfiles((prev) => {
      if (
        input.cloneFromProfileId &&
        prev.some(
          (p) => p.kind === 'new' && p.input.cloneFromProfileId === input.cloneFromProfileId
        )
      ) {
        return prev
      }
      return [...prev, { key: newPendingKey(), kind: 'new', input }]
    })
    setShowAddProfile(false)
  }

  const handlePickProfile = (profiles: ConnectionProfile[]): void => {
    setPendingProfiles((prev) => mergePickedProfiles(prev, profiles))
    setShowPickDialog(false)
  }

  const excludeProfileIds = useMemo(
    () =>
      pendingProfiles.flatMap((p) => {
        if (p.kind === 'picked') return [p.profile.id]
        if (p.input.cloneFromProfileId) return [p.input.cloneFromProfileId]
        return []
      }),
    [pendingProfiles]
  )

  const removePending = (key: string): void => {
    setPendingProfiles((prev) => prev.filter((p) => p.key !== key))
  }

  const formErrorEntries = Object.entries(formErrors)

  return (
    <>
      <ScrollableFormShell
        bordered={!compact}
        maxHeightClass={compact ? SCROLLABLE_FORM_MAX_HEIGHT_PANEL : undefined}
        title={
          !host ? (
            <span className="text-base font-medium text-fg">
              {isCopyMode ? 'Copy host' : 'Add host'}
            </span>
          ) : undefined
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-3 py-1.5 text-muted hover:bg-surface-raised"
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              disabled={saving}
              className="rounded bg-accent px-3 py-1.5 text-accent-on hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-3 text-sm">
          {formErrorEntries.length > 0 && (
            <ul className="rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-danger">
              {formErrorEntries.map(([field, msg]) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          )}
          <label className="block">
            <span className="text-muted">Name</span>
            <input
              className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          {!host && (
            <label className="block">
              <span className="text-muted">Type</span>
              <select
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                value={kind}
                onChange={(e) => setKind(e.target.value as HostKind)}
              >
                <option value="remote">Remote host</option>
                <option value="local">Local project</option>
              </select>
            </label>
          )}
          {isLocal ? (
            !host && (
              <label className="block">
                <span className="text-muted">Shell</span>
                <select
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                  value={localShell}
                  onChange={(e) => setLocalShell(e.target.value)}
                >
                  {['zsh', 'bash', 'sh', 'pwsh', 'powershell', 'cmd'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )
          ) : (
            <>
              <label className="block">
                <span className="text-muted">Hostname / IP</span>
                <input
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="text-muted">HTTP Endpoint</span>
                <input
                  type="url"
                  className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                  value={httpEndpoint}
                  onChange={(e) => {
                    setHttpEndpoint(e.target.value)
                    if (httpEndpointError) setHttpEndpointError(null)
                  }}
                  placeholder="https://alb.example/health"
                />
                <span className="mt-1 block text-xs text-muted">
                  Optional. For HTTP(S) traffic through ALB terminating on this host.
                </span>
                {httpEndpointError && (
                  <span className="mt-1 block text-xs text-danger">{httpEndpointError}</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-muted">Port</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="text-muted">OS</span>
                  <select
                    className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                    value={osType}
                    onChange={(e) => setOsType(e.target.value as OsType)}
                  >
                    {OS_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          <label className="block">
            <span className="text-muted">Log verbosity</span>
            <select
              className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
              value={logVerbosity}
              onChange={(e) => setLogVerbosity(e.target.value as HostLogVerbosity)}
            >
              {HOST_LOG_VERBOSITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.description}
                </option>
              ))}
            </select>
          </label>

          {(host || isCopyMode) && (
            <label className="block">
              <span className="text-muted">UX profile</span>
              <select
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                value={uxProfileId}
                onChange={(e) => setUxProfileId(e.target.value)}
              >
                <option value="">Use global active profile</option>
                {uxProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-muted">
                Controls terminal colors and shell prompt style. Edit the profile to change Shell
                prompt (Consoleri vs server).
              </span>
            </label>
          )}

          {!host && !isLocal && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Connection profiles
                </span>
                {!showAddProfile && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPickDialog(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      + Pick profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddProfile(true)}
                      className="text-xs text-accent hover:underline"
                    >
                      + Add profile
                    </button>
                  </div>
                )}
              </div>

              {showAddProfile && (
                <div className="mb-2 rounded border border-border bg-bg">
                  <ProfileForm
                    compact
                    draft
                    excludeProfileIds={excludeProfileIds}
                    onDraftSave={handleDraftProfile}
                    onSave={() => setShowAddProfile(false)}
                    onCancel={() => setShowAddProfile(false)}
                  />
                </div>
              )}

              {pendingProfiles.length === 0 && !showAddProfile ? (
                <p className="text-xs text-muted">No profiles yet</p>
              ) : (
                <ul className="space-y-1">
                  {pendingProfiles.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center justify-between gap-2 rounded bg-bg px-2 py-1.5 text-xs text-fg-2"
                    >
                      <span className="truncate">{pendingProfileLabel(item)}</span>
                      <button
                        type="button"
                        onClick={() => removePending(item.key)}
                        className="shrink-0 text-muted hover:text-danger"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <label className="block">
            <span className="text-muted">Tags (comma-separated)</span>
            <TagInput
              id="host-tags"
              value={tags}
              onChange={setTags}
              existingTags={allHostTags}
              placeholder="prod, db, eu-west"
            />
          </label>

          {!isLocal && (host || isCopyMode) && otherHosts.length > 0 && (
            <div className="block">
              <span className="text-muted">Related hosts</span>
              <div className="mt-1 max-h-28 overflow-y-auto rounded border border-border bg-bg p-2">
                {otherHosts.map((h) => (
                  <label
                    key={h.id}
                    className="flex cursor-pointer items-center gap-2 py-0.5 text-xs text-fg-2"
                  >
                    <input
                      type="checkbox"
                      checked={relatedHostIds.includes(h.id)}
                      onChange={(e) => {
                        setRelatedHostIds((prev) =>
                          e.target.checked ? [...prev, h.id] : prev.filter((id) => id !== h.id)
                        )
                      }}
                    />
                    <span className="truncate">{h.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!isLocal && (host || isCopyMode) && (
            <label className="block">
              <span className="text-muted">Gateway host</span>
              <select
                className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
                value={gatewayHostId}
                onChange={(e) => setGatewayHostId(e.target.value)}
              >
                <option value="">None (direct)</option>
                {gatewayOptions.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-muted">Notes</span>
            <textarea
              className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-fg"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {host && profiles && onProfilesChanged && onConnect && (
            <HostProfilesSection
              host={host}
              profiles={profiles}
              onConnect={onConnect}
              onProfilesChanged={onProfilesChanged}
            />
          )}
        </form>
      </ScrollableFormShell>

      {showPickDialog && !host && !isLocal && (
        <PickProfileDialog
          targetHostLabel={name.trim() || 'new host'}
          excludeProfileIds={excludeProfileIds}
          onClose={() => setShowPickDialog(false)}
          onPick={handlePickProfile}
        />
      )}
    </>
  )
}
