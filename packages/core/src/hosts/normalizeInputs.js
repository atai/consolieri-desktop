import { normalizeHostLogVerbosity } from '../logging/verbosity';
export function normalizeHomeDir(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
// ── Validation constants ──────────────────────────────────────────────────────
const VALID_OS_TYPES = new Set(['windows', 'linux', 'macos', 'unknown']);
const VALID_HOST_KINDS = new Set(['remote', 'local']);
const VALID_PROTOCOLS = new Set(['ssh', 'rdp', 'vnc', 'local_pty', 'wsl']);
const VALID_AUTH_METHODS = new Set(['password', 'key', 'none']);
// ── normalizeHostInput ────────────────────────────────────────────────────────
export function normalizeHostInput(input) {
    const errors = {};
    const name = (input.name ?? '').trim();
    if (!name)
        errors.name = 'Name is required';
    const kind = input.kind ?? 'remote';
    if (!VALID_HOST_KINDS.has(kind)) {
        errors.kind = `Invalid host kind "${kind}"`;
    }
    const isLocal = kind === 'local';
    const hostname = (input.hostname ?? (isLocal ? 'localhost' : '')).trim();
    if (!hostname)
        errors.hostname = 'Hostname is required';
    const port = input.port ?? (isLocal ? 0 : 22);
    if (isLocal) {
        if (!Number.isInteger(port) || port < 0 || port > 65535) {
            errors.port = 'Port must be an integer between 0 and 65535';
        }
    }
    else if (!Number.isInteger(port) || port < 1 || port > 65535) {
        errors.port = 'Port must be an integer between 1 and 65535';
    }
    const osType = input.osType ?? (isLocal ? 'macos' : 'unknown');
    if (!VALID_OS_TYPES.has(osType)) {
        errors.osType = `Invalid OS type "${osType}"`;
    }
    if (Object.keys(errors).length > 0) {
        return { errors, normalized: null };
    }
    const tags = Array.from(new Set((input.tags ?? [])
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)));
    return {
        errors: {},
        normalized: {
            name,
            hostname: isLocal ? 'localhost' : hostname,
            port: isLocal ? 0 : port,
            osType: osType,
            kind: kind,
            tags,
            groupId: input.groupId ?? null,
            notes: (input.notes ?? '').trim(),
            defaultProfileId: input.defaultProfileId ?? null,
            uxProfileId: input.uxProfileId ?? null,
            logVerbosity: normalizeHostLogVerbosity(input.logVerbosity),
            relatedHostIds: isLocal ? [] : (input.relatedHostIds ?? []),
            gatewayHostId: isLocal ? null : (input.gatewayHostId ?? null),
            httpEndpoint: isLocal ? null : (input.httpEndpoint ?? null),
            homeDir: normalizeHomeDir(input.homeDir)
        }
    };
}
// ── normalizeProfileInput ─────────────────────────────────────────────────────
export function normalizeProfileInput(input) {
    const errors = {};
    const name = (input.name ?? '').trim();
    if (!name)
        errors.name = 'Name is required';
    const protocol = input.protocol ?? '';
    if (!protocol) {
        errors.protocol = 'Protocol is required';
    }
    else if (!VALID_PROTOCOLS.has(protocol)) {
        errors.protocol = `Invalid protocol "${protocol}"`;
    }
    const authMethod = input.authMethod ?? 'password';
    if (!VALID_AUTH_METHODS.has(authMethod)) {
        errors.authMethod = `Invalid auth method "${authMethod}"`;
    }
    if (Object.keys(errors).length > 0) {
        return { errors, normalized: null };
    }
    const rawUsername = input.username !== undefined ? input.username : null;
    const username = typeof rawUsername === 'string' ? rawUsername.trim() || null : null;
    return {
        errors: {},
        normalized: {
            name,
            protocol: protocol,
            shell: input.shell ?? null,
            username,
            authMethod: authMethod,
            credentialRef: input.credentialRef ?? null,
            jumpHostId: input.jumpHostId ?? null,
            extra: input.extra ?? {}
        }
    };
}
