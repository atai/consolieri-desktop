import { isKeyFileRef } from '../../keys/credentialRef';
import { HOSTS_BUNDLE_VERSION } from './types';
export function sanitizeCredentialRefForExport(credentialRef) {
    if (!credentialRef)
        return null;
    if (isKeyFileRef(credentialRef))
        return credentialRef;
    if (credentialRef.startsWith('profile:'))
        return null;
    return credentialRef;
}
export function hostToExportItem(host, sessionPreset) {
    const { id, createdAt, updatedAt, ...data } = host;
    return {
        exportId: id,
        ...data,
        sessionPreset: sessionPreset ?? null
    };
}
export function profileToExportItem(profile) {
    const { id, credentialRef, ...data } = profile;
    return {
        exportId: id,
        ...data,
        credentialRef: sanitizeCredentialRefForExport(credentialRef)
    };
}
export function groupToExportItem(group) {
    const { id, ...data } = group;
    return { exportId: id, ...data };
}
export function buildHostsExportDocument(groups, hosts, profiles, links, exportedAt = new Date().toISOString(), presetsByHostId = new Map()) {
    return {
        version: HOSTS_BUNDLE_VERSION,
        exportedAt,
        groups: groups.map(groupToExportItem),
        hosts: hosts.map((h) => hostToExportItem(h, presetsByHostId.get(h.id) ?? null)),
        profiles: profiles.map(profileToExportItem),
        links: links.map((link) => ({
            hostId: link.hostId,
            profileId: link.profileId
        }))
    };
}
export function serializeHostsExportDocument(doc) {
    return `${JSON.stringify(doc, null, 2)}\n`;
}
