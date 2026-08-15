import type { MosaicNode } from 'react-mosaic-component'
import type {
  Host,
  HostSessionPreset,
  HostSessionPresetInput,
  HostSessionPresetPane,
  LocalShellType,
  OpenSessionRequest,
  PaneBinding,
  Protocol,
  SessionInfo
} from '@shared/types'
import { createPaneBinding, openMosaicSession } from './mosaic/sessionMosaicOps'
import { insertPaneIntoLayout } from '@consoleri/core'
import type { MosaicNode as CoreMosaicNode } from '@consoleri/core'

const LOCAL_PROTOCOLS = new Set<Protocol>(['local_pty', 'wsl'])

export function isLocalOnlyLayout(panes: PaneBinding[]): boolean {
  return panes.length > 0 && panes.every((p) => LOCAL_PROTOCOLS.has(p.protocol))
}

export function defaultLocalShell(): Exclude<LocalShellType, 'wsl'> {
  const platform = navigator.platform.toLowerCase()
  if (platform.includes('win')) return 'powershell'
  if (platform.includes('mac')) return 'zsh'
  return 'bash'
}

export async function collectPresetFromPanes(
  layout: MosaicNode<string> | null,
  panes: PaneBinding[]
): Promise<HostSessionPresetInput> {
  const presetPanes: HostSessionPresetPane[] = []
  for (const pane of panes) {
    let cwd = pane.connectRequest.cwd ?? null
    if (pane.sessionId) {
      const live = await window.consoleri.sessions.getCwd(pane.sessionId)
      if (live) cwd = live
    }
    presetPanes.push({
      paneId: pane.paneId,
      title: pane.title,
      protocol: pane.protocol,
      localShell: pane.connectRequest.localShell,
      wslDistro: pane.connectRequest.wslDistro,
      cwd,
      profileId: pane.connectRequest.profileId
    })
  }
  return { layout, panes: presetPanes }
}

export async function savePresetToHost(
  hostId: string,
  layout: MosaicNode<string> | null,
  panes: PaneBinding[]
): Promise<HostSessionPreset> {
  const input = await collectPresetFromPanes(layout, panes)
  return window.consoleri.hostPresets.save(hostId, input)
}

export async function createLocalProjectHost(options: {
  name: string
  tags?: string[]
  groupId?: string | null
  shell?: LocalShellType
  layout: MosaicNode<string> | null
  panes: PaneBinding[]
}): Promise<Host> {
  const shell = options.shell ?? defaultLocalShell()
  const osType =
    shell === 'powershell' || shell === 'pwsh' || shell === 'cmd' ? 'windows' : 'macos'
  const host = await window.consoleri.hosts.create({
    name: options.name,
    hostname: 'localhost',
    port: 0,
    kind: 'local',
    osType,
    tags: options.tags ?? [],
    groupId: options.groupId ?? null
  })
  const profile = await window.consoleri.profiles.create({
    name: shell,
    protocol: shell === 'wsl' ? 'wsl' : 'local_pty',
    shell,
    authMethod: 'none',
    linkHostId: host.id
  })
  await window.consoleri.hosts.update(host.id, { defaultProfileId: profile.id })

  const panesWithHost = options.panes.map((p) => ({
    ...p,
    connectRequest: {
      ...p.connectRequest,
      hostId: host.id,
      profileId: profile.id,
      paneId: p.paneId,
      localShell: p.connectRequest.localShell ?? shell,
      protocol: p.protocol
    }
  }))
  await savePresetToHost(host.id, options.layout, panesWithHost)
  return (await window.consoleri.hosts.get(host.id)) ?? host
}

export function presetPaneToConnectRequest(
  host: Host,
  pane: HostSessionPresetPane
): OpenSessionRequest {
  return {
    hostId: host.id,
    profileId: pane.profileId ?? host.defaultProfileId ?? undefined,
    protocol: pane.protocol,
    title: pane.title,
    localShell: pane.localShell,
    wslDistro: pane.wslDistro,
    cwd: pane.cwd ?? undefined,
    paneId: pane.paneId
  }
}

export async function openLocalHostPresetInWorkspace(
  host: Host,
  preset: HostSessionPreset
): Promise<{
  layout: MosaicNode<string> | null
  panes: PaneBinding[]
  sessions: SessionInfo[]
}> {
  const sessions: SessionInfo[] = []
  const panes: PaneBinding[] = []
  let layout: MosaicNode<string> | null = null

  for (const presetPane of preset.panes) {
    const connectRequest = presetPaneToConnectRequest(host, presetPane)
    const session = await openMosaicSession(connectRequest)
    if (!session) continue
    sessions.push(session)
    const binding: PaneBinding = {
      paneId: presetPane.paneId,
      sessionId: session.id,
      protocol: session.protocol,
      title: presetPane.title || session.title,
      connectRequest
    }
    panes.push(binding)
    layout = insertPaneIntoLayout(
      layout as CoreMosaicNode<string> | null,
      binding.paneId
    ) as MosaicNode<string>
  }

  // Prefer saved layout tree when pane ids match
  if (preset.layout && typeof preset.layout === 'object') {
    layout = preset.layout as MosaicNode<string>
  }

  return { layout, panes, sessions }
}

export async function restoreHostPresetSessions(
  host: Host,
  preset: HostSessionPreset
): Promise<{ panes: PaneBinding[]; sessions: SessionInfo[]; layout: MosaicNode<string> | null }> {
  const sessions: SessionInfo[] = []
  const panes: PaneBinding[] = []

  for (const presetPane of preset.panes) {
    const connectRequest = presetPaneToConnectRequest(host, presetPane)
    const session = await openMosaicSession(connectRequest)
    if (!session) continue
    sessions.push(session)
    panes.push({
      paneId: presetPane.paneId,
      sessionId: session.id,
      protocol: session.protocol,
      title: presetPane.title || session.title,
      connectRequest
    })
  }

  const layout =
    preset.layout && panes.length > 0
      ? (preset.layout as MosaicNode<string>)
      : panes.length === 1
        ? panes[0]!.paneId
        : null

  return { layout, panes, sessions }
}

/** Re-export for callers that open a single binding after session create */
export { createPaneBinding }
