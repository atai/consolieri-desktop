import type { Host, OpenSessionRequest } from '@shared/types'
import { usePreferencesStore } from '../stores/preferencesStore'
import { useSessionWorkspaceStore } from '../stores/sessionWorkspaceStore'
import { openSession, openSessionAndAddToWorkspace } from './openSession'
import { restoreHostPresetSessions } from './localProject'

export async function resolveHostConnectRequest(
  host: Host,
  profileId?: string
): Promise<OpenSessionRequest> {
  if (host.kind === 'local') {
    const hostProfiles = await window.consoleri.profiles.list(host.id)
    const profile = profileId
      ? hostProfiles.find((p) => p.id === profileId)
      : host.defaultProfileId
        ? hostProfiles.find((p) => p.id === host.defaultProfileId)
        : hostProfiles[0]
    const shell =
      (profile?.shell as OpenSessionRequest['localShell'] | undefined) ??
      (profile?.protocol === 'wsl' ? 'wsl' : undefined)
    return {
      hostId: host.id,
      profileId: profile?.id,
      protocol: profile?.protocol ?? 'local_pty',
      title: host.name,
      localShell: shell
    }
  }

  const hostProfiles = await window.consoleri.profiles.list(host.id)
  const profile = profileId
    ? hostProfiles.find((p) => p.id === profileId)
    : host.defaultProfileId
      ? hostProfiles.find((p) => p.id === host.defaultProfileId)
      : hostProfiles[0]
  return {
    hostId: host.id,
    profileId: profile?.id
  }
}

export async function connectLocalHostWithPreset(host: Host): Promise<boolean> {
  const preset = await window.consoleri.hostPresets.get(host.id)
  if (!preset || preset.panes.length === 0) return false

  const mode = usePreferencesStore.getState().settings.sessionOpenMode
  if (mode === 'window') {
    await window.consoleri.sessions.openHostWindow(host.id)
    return true
  }

  const restored = await restoreHostPresetSessions(host, preset)
  const store = useSessionWorkspaceStore.getState()
  for (const session of restored.sessions) {
    store.upsertSession(session)
  }
  store.persistWorkspace(restored.layout, restored.panes)
  return true
}

export async function connectHost(host: Host, profileId?: string): Promise<void> {
  if (host.kind === 'local') {
    const opened = await connectLocalHostWithPreset(host)
    if (opened) return
  }
  const request = await resolveHostConnectRequest(host, profileId)
  await openSessionAndAddToWorkspace(request)
}

export async function connectHostInWindow(host: Host, profileId?: string): Promise<void> {
  if (host.kind === 'local') {
    const preset = await window.consoleri.hostPresets.get(host.id)
    if (preset && preset.panes.length > 0) {
      await window.consoleri.sessions.openHostWindow(host.id)
      return
    }
  }
  const request = await resolveHostConnectRequest(host, profileId)
  const session = await openSession(request)
  if (!session) return
  await window.consoleri.sessions.openSessionWindow(session.id)
}

export async function connectFromList(host: Host, profileId?: string): Promise<void> {
  const mode = usePreferencesStore.getState().settings.sessionOpenMode
  if (mode === 'window') return connectHostInWindow(host, profileId)
  return connectHost(host, profileId)
}

export async function openLocalSessionFromList(request: OpenSessionRequest): Promise<void> {
  const mode = usePreferencesStore.getState().settings.sessionOpenMode
  if (mode === 'window') {
    const session = await openSession(request)
    if (session) await window.consoleri.sessions.openSessionWindow(session.id)
    return
  }
  await openSessionAndAddToWorkspace(request)
}
