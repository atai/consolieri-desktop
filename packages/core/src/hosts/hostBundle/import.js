import { isKeyFileRef } from '../../keys/credentialRef';
import { normalizeHostLogVerbosity } from '../../logging/verbosity';
import { normalizeHomeDir } from '../normalizeInputs';
import { normalizeHttpEndpoint } from '../normalizeHttpEndpoint';
import { HOSTS_BUNDLE_VERSION } from './types';
const OS_TYPES = ['windows', 'linux', 'macos', 'unknown'];
const HOST_KINDS = ['remote', 'local'];
const PROTOCOLS = ['ssh', 'local_pty', 'rdp', 'vnc', 'wsl'];
const AUTH_METHODS = ['password', 'key', 'none'];
function isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
function normalizeOsType(value) {
    if (typeof value === 'string' && OS_TYPES.includes(value)) {
        return value;
    }
    return 'unknown';
}
function normalizeHostKind(value) {
    if (typeof value === 'string' && HOST_KINDS.includes(value)) {
        return value;
    }
    return 'remote';
}
function normalizeProtocol(value) {
    if (typeof value === 'string' && PROTOCOLS.includes(value)) {
        return value;
    }
    return 'ssh';
}
function normalizeAuthMethod(value) {
    if (typeof value === 'string' && AUTH_METHODS.includes(value)) {
        return value;
    }
    return 'password';
}
function normalizeStringArray(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === 'string');
}
function normalizeNullableString(value) {
    if (value === null || value === undefined || value === '')
        return null;
    return typeof value === 'string' ? value : null;
}
function normalizeExtra(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return {};
    return value;
}
function normalizeSessionPreset(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const entry = value;
    if (!Array.isArray(entry.panes))
        return null;
    const panes = entry.panes.flatMap((p) => {
        if (!p || typeof p !== 'object')
            return [];
        const pane = p;
        if (typeof pane.paneId !== 'string')
            return [];
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
        ];
    });
    return { layout: entry.layout ?? null, panes };
}
export function sanitizeCredentialRefForImport(credentialRef) {
    if (!credentialRef)
        return null;
    if (isKeyFileRef(credentialRef))
        return credentialRef;
    if (credentialRef.startsWith('profile:'))
        return null;
    return credentialRef;
}
export function normalizeGroupExportItem(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const entry = raw;
    if (!isNonEmptyString(entry.exportId) || !isNonEmptyString(entry.name))
        return null;
    return {
        exportId: entry.exportId,
        name: entry.name,
        parentId: normalizeNullableString(entry.parentId),
        sortOrder: typeof entry.sortOrder === 'number' ? entry.sortOrder : 0
    };
}
export function normalizeHostExportItem(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const entry = raw;
    const kind = normalizeHostKind(entry.kind);
    if (!isNonEmptyString(entry.name))
        return null;
    if (kind === 'remote' && !isNonEmptyString(entry.hostname))
        return null;
    const hostname = kind === 'local' ? 'localhost' : entry.hostname;
    const exportId = isNonEmptyString(entry.exportId)
        ? entry.exportId
        : `${hostname}:${entry.port ?? (kind === 'local' ? 0 : 22)}`;
    let httpEndpoint = null;
    try {
        httpEndpoint =
            kind === 'local'
                ? null
                : normalizeHttpEndpoint(entry.httpEndpoint);
    }
    catch {
        return null;
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
        homeDir: normalizeHomeDir(typeof entry.homeDir === 'string' ? entry.homeDir : null),
        sessionPreset: normalizeSessionPreset(entry.sessionPreset)
    };
}
export function normalizeProfileExportItem(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const entry = raw;
    if (!isNonEmptyString(entry.exportId) || !isNonEmptyString(entry.name))
        return null;
    const credentialRef = sanitizeCredentialRefForImport(normalizeNullableString(entry.credentialRef));
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
    };
}
export function normalizeLinkExportItem(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const entry = raw;
    if (!isNonEmptyString(entry.hostId) || !isNonEmptyString(entry.profileId))
        return null;
    return { hostId: entry.hostId, profileId: entry.profileId };
}
export function legacyHostsArrayToDocument(items, exportedAt = new Date().toISOString()) {
    const hosts = items.map(normalizeHostExportItem).filter((h) => h !== null);
    if (hosts.length === 0) {
        throw new Error('No valid hosts in import data');
    }
    return {
        version: HOSTS_BUNDLE_VERSION,
        exportedAt,
        groups: [],
        hosts,
        profiles: [],
        links: []
    };
}
export function normalizeHostsExportDocument(raw) {
    if (!raw || typeof raw !== 'object') {
        throw new Error('Invalid hosts export document');
    }
    const entry = raw;
    const groups = Array.isArray(entry.groups)
        ? entry.groups.map(normalizeGroupExportItem).filter((g) => g !== null)
        : [];
    const hosts = Array.isArray(entry.hosts)
        ? entry.hosts.map(normalizeHostExportItem).filter((h) => h !== null)
        : [];
    const profiles = Array.isArray(entry.profiles)
        ? entry.profiles.map(normalizeProfileExportItem).filter((p) => p !== null)
        : [];
    const links = Array.isArray(entry.links)
        ? entry.links.map(normalizeLinkExportItem).filter((l) => l !== null)
        : [];
    if (hosts.length === 0 && groups.length === 0 && profiles.length === 0) {
        throw new Error('Hosts export document is empty');
    }
    return {
        version: HOSTS_BUNDLE_VERSION,
        exportedAt: typeof entry.exportedAt === 'string' ? entry.exportedAt : new Date().toISOString(),
        groups,
        hosts,
        profiles,
        links
    };
}
export function parseHostsImportJson(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error('Invalid JSON');
    }
    if (Array.isArray(parsed)) {
        return legacyHostsArrayToDocument(parsed);
    }
    return normalizeHostsExportDocument(parsed);
}
export function parseHostsImportPayload(payload) {
    if (typeof payload === 'string') {
        return parseHostsImportJson(payload);
    }
    if (Array.isArray(payload)) {
        return legacyHostsArrayToDocument(payload);
    }
    return normalizeHostsExportDocument(payload);
}
export function sortGroupsForImport(groups) {
    const byId = new Map(groups.map((g) => [g.exportId, g]));
    const sorted = [];
    const visited = new Set();
    const visit = (group) => {
        if (visited.has(group.exportId))
            return;
        if (group.parentId && byId.has(group.parentId) && !visited.has(group.parentId)) {
            visit(byId.get(group.parentId));
        }
        visited.add(group.exportId);
        sorted.push(group);
    };
    for (const group of groups) {
        visit(group);
    }
    return sorted;
}
