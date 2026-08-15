import { isKeyFileRef } from '../../keys/credentialRef'
import { normalizeHostLogVerbosity } from '../../logging/verbosity'
import type { AuthMethod, HostKind, OsType, Protocol } from '../../types'
import { normalizeHttpEndpoint } from '../normalizeHttpEndpoint'
import type {
  GroupExportItem,
  HostExportItem,
  HostProfileLinkExport,
  HostsExportDocument,
  HostSessionPresetExport,
  ProfileExportItem
} from './types'
import { HOSTS_BUNDLE_VERSION } from './types'

const OS_TYPES: OsType[] = ['windows', 'linux', 'macos', 'unknown']
const HOST_KINDS: HostKind[] = ['remote', 'local']
const PROTOCOLS: Protocol[] = ['ssh', 'local_pty', 'rdp', 'vnc', 'wsl']
const AUTH_METHODS: AuthMethod[] = ['password', 'key', 'none']

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function normalizeOsType(value: unknown): OsType {
  if (typeof value === 'string' && OS_TYPES.includes(value as OsType)) {
    return value as OsType
  }
  return 'unknown'
}

function normalizeHostKind(value: unknown): HostKind {
  if (typeof value === 'string' && HOST_KINDS.includes(value as HostKind)) {
    return value as HostKind
  }
  return 'remote'
}

function normalizeProtocol(value: unknown): Protocol {
  if (typeof value === 'string' && PROTOCOLS.includes(value as Protocol)) {
    return value as Protocol
  }
  return 'ssh'
}

function normalizeAuthMethod(value: unknown): AuthMethod {
  if (typeof value === 'string' && AUTH_METHODS.includes(value as AuthMethod)) {
    return value as AuthMethod
  }
  return 'password'
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : null
}

function normalizeExtra(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function normalizeSessionPreset(value: unknown): HostSessionPresetExport | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const entry = value as Record<string, unknown>
  if (!Array.isArray(entry.panes)) return null
  const panes = entry.panes.flatMap((p) => {
    if (!p || typeof p !== 'object') return []
    const pane = p as Record<string, unknown>
    if (typeof pane.paneId !== 'string') return []
    return [
      {
        paneId: pane.paneId,
        title: typeof pane.title === 'string' ? pane.title : pane.paneId,
        protocol: normalizeProtocol(pane.protocol),
        localShell: typeof pane.localShell === 'string' ? pane.localShell : undefined,
        wslDistro: typeof pane.wslDistro === 'string' ? pane.wslDistro : undefined,
        cwd: typeof pane.cwd === 'string' ? pane.cwd : pane.cwd === null ? null : undefined,
        profileId: typeof pane.profileId === 'string' ? pane.profileId : undefined
      }
    ]
  })
  return { layout: entry.layout ?? null, panes }
}

export function sanitizeCredentialRefForImport(credentialRef: string | null): string | null {
  if (!credentialRef) return null
  if (isKeyFileRef(credentialRef)) return credentialRef
  if (credentialRef.startsWith('profile:')) return null
  return credentialRef
}

export function normalizeGroupExportItem(raw: unknown): GroupExportItem | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as Record<string, unknown>
  if (!isNonEmptyString(entry.exportId) || !isNonEmptyString(entry.name)) return null
  return {
    exportId: entry.exportId,
    name: entry.name,
    parentId: normalizeNullableString(entry.parentId),
    sortOrder: typeof entry.sortOrder === 'number' ? entry.sortOrder : 0
  }
}

export function normalizeHostExportItem(raw: unknown): HostExportItem | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as Record<string, unknown>
  const kind = normalizeHostKind(entry.kind)
  if (!isNonEmptyString(entry.name)) return null
  if (kind === 'remote' && !isNonEmptyString(entry.hostname)) return null

  const hostname = kind === 'local' ? 'localhost' : (entry.hostname as string)
  const exportId = isNonEmptyString(entry.exportId)
    ? entry.exportId
    : `${hostname}:${entry.port ?? (kind === 'local' ? 0 : 22)}`

  let httpEndpoint: string | null = null
  try {
    httpEndpoint =
      kind === 'local'
        ? null
        : normalizeHttpEndpoint(entry.httpEndpoint as string | null | undefined)
  } catch {
    return null
  }

  return {
    exportId,
    name: entry.name,
    hostname,
    port: typeof entry.port === 'number' ? entry.port : kind === 'local' ? 0 : 22,
    osType: normalizeOsType(entry.osType),
    kind,
    tags: normalizeStringArray(entry.tags),
    groupId: normalizeNullableString(entry.groupId),
    notes: typeof entry.notes === 'string' ? entry.notes : '',
    defaultProfileId: normalizeNullableString(entry.defaultProfileId),
    uxProfileId: normalizeNullableString(entry.uxProfileId),
    logVerbosity: normalizeHostLogVerbosity(entry.logVerbosity),
    relatedHostIds: kind === 'local' ? [] : normalizeStringArray(entry.relatedHostIds),
    gatewayHostId: kind === 'local' ? null : normalizeNullableString(entry.gatewayHostId),
    httpEndpoint,
    sessionPreset: normalizeSessionPreset(entry.sessionPreset)
  }
}

export function normalizeProfileExportItem(raw: unknown): ProfileExportItem | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as Record<string, unknown>
  if (!isNonEmptyString(entry.exportId) || !isNonEmptyString(entry.name)) return null

  const credentialRef = sanitizeCredentialRefForImport(
    normalizeNullableString(entry.credentialRef)
  )

  return {
    exportId: entry.exportId,
    name: entry.name,
    protocol: normalizeProtocol(entry.protocol),
    shell: normalizeNullableString(entry.shell),
    username: normalizeNullableString(entry.username),
    authMethod: normalizeAuthMethod(entry.authMethod),
    credentialRef,
    jumpHostId: normalizeNullableString(entry.jumpHostId),
    extra: normalizeExtra(entry.extra)
  }
}

export function normalizeLinkExportItem(raw: unknown): HostProfileLinkExport | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as Record<string, unknown>
  if (!isNonEmptyString(entry.hostId) || !isNonEmptyString(entry.profileId)) return null
  return { hostId: entry.hostId, profileId: entry.profileId }
}

export function legacyHostsArrayToDocument(
  items: unknown[],
  exportedAt: string = new Date().toISOString()
): HostsExportDocument {
  const hosts = items.map(normalizeHostExportItem).filter((h): h is HostExportItem => h !== null)
  if (hosts.length === 0) {
    throw new Error('No valid hosts in import data')
  }
  return {
    version: HOSTS_BUNDLE_VERSION,
    exportedAt,
    groups: [],
    hosts,
    profiles: [],
    links: []
  }
}

export function normalizeHostsExportDocument(raw: unknown): HostsExportDocument {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid hosts export document')
  }

  const entry = raw as Record<string, unknown>
  const groups = Array.isArray(entry.groups)
    ? entry.groups.map(normalizeGroupExportItem).filter((g): g is GroupExportItem => g !== null)
    : []
  const hosts = Array.isArray(entry.hosts)
    ? entry.hosts.map(normalizeHostExportItem).filter((h): h is HostExportItem => h !== null)
    : []
  const profiles = Array.isArray(entry.profiles)
    ? entry.profiles.map(normalizeProfileExportItem).filter((p): p is ProfileExportItem => p !== null)
    : []
  const links = Array.isArray(entry.links)
    ? entry.links.map(normalizeLinkExportItem).filter((l): l is HostProfileLinkExport => l !== null)
    : []

  if (hosts.length === 0 && groups.length === 0 && profiles.length === 0) {
    throw new Error('Hosts export document is empty')
  }

  return {
    version: HOSTS_BUNDLE_VERSION,
    exportedAt: typeof entry.exportedAt === 'string' ? entry.exportedAt : new Date().toISOString(),
    groups,
    hosts,
    profiles,
    links
  }
}

export function parseHostsImportJson(raw: string): HostsExportDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON')
  }

  if (Array.isArray(parsed)) {
    return legacyHostsArrayToDocument(parsed)
  }

  return normalizeHostsExportDocument(parsed)
}

export function parseHostsImportPayload(payload: unknown): HostsExportDocument {
  if (typeof payload === 'string') {
    return parseHostsImportJson(payload)
  }

  if (Array.isArray(payload)) {
    return legacyHostsArrayToDocument(payload)
  }

  return normalizeHostsExportDocument(payload)
}

export function sortGroupsForImport(groups: GroupExportItem[]): GroupExportItem[] {
  const byId = new Map(groups.map((g) => [g.exportId, g]))
  const sorted: GroupExportItem[] = []
  const visited = new Set<string>()

  const visit = (group: GroupExportItem): void => {
    if (visited.has(group.exportId)) return
    if (group.parentId && byId.has(group.parentId) && !visited.has(group.parentId)) {
      visit(byId.get(group.parentId)!)
    }
    visited.add(group.exportId)
    sorted.push(group)
  }

  for (const group of groups) {
    visit(group)
  }
  return sorted
}
