import { normalizeHostLogVerbosity } from '../logging/verbosity';
export function rowToHost(row) {
    const kind = row.kind ?? 'remote';
    return {
        id: row.id,
        name: row.name,
        hostname: row.hostname,
        port: row.port,
        osType: row.os_type,
        kind: kind === 'local' ? 'local' : 'remote',
        tags: JSON.parse(row.tags_json || '[]'),
        groupId: row.group_id || null,
        notes: row.notes || '',
        defaultProfileId: row.default_profile_id || null,
        uxProfileId: row.ux_profile_id || null,
        logVerbosity: normalizeHostLogVerbosity(row.log_verbosity),
        relatedHostIds: JSON.parse(row.related_hosts_json || '[]'),
        gatewayHostId: row.gateway_host_id || null,
        httpEndpoint: row.http_endpoint || null,
        homeDir: row.home_dir || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
export function rowToProfile(row) {
    return {
        id: row.id,
        name: row.name,
        protocol: row.protocol,
        shell: row.shell || null,
        username: row.username || null,
        authMethod: row.auth_method,
        credentialRef: row.credential_ref || null,
        jumpHostId: row.jump_host_id || null,
        extra: JSON.parse(row.extra_json || '{}')
    };
}
