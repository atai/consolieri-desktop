export function remapExportId(exportId, idMap) {
    if (!exportId)
        return null;
    return idMap.get(exportId) ?? null;
}
export function remapExportIds(exportIds, idMap) {
    return exportIds
        .map((id) => idMap.get(id))
        .filter((id) => Boolean(id));
}
export function resolveUxProfileIdForImport(uxProfileId, validUxProfileIds) {
    if (!uxProfileId)
        return null;
    return validUxProfileIds.has(uxProfileId) ? uxProfileId : null;
}
export function groupCreateFromExportItem(group, groupIdMap) {
    return {
        exportId: group.exportId,
        name: group.name,
        parentId: remapExportId(group.parentId, groupIdMap),
        sortOrder: group.sortOrder
    };
}
export function hostCreateFromExportItem(host, groupIdMap, validUxProfileIds) {
    return {
        exportId: host.exportId,
        input: {
            name: host.name,
            hostname: host.hostname,
            port: host.port,
            osType: host.osType,
            kind: host.kind,
            tags: host.tags,
            groupId: remapExportId(host.groupId, groupIdMap),
            notes: host.notes,
            uxProfileId: resolveUxProfileIdForImport(host.uxProfileId, validUxProfileIds),
            logVerbosity: host.logVerbosity,
            httpEndpoint: host.httpEndpoint,
            homeDir: host.homeDir
        },
        sessionPreset: host.sessionPreset ?? null
    };
}
export function hostRelationPatchFromExportItem(host, hostIdMap, profileIdMap) {
    const relatedHostIds = remapExportIds(host.relatedHostIds, hostIdMap);
    const gatewayHostId = remapExportId(host.gatewayHostId, hostIdMap);
    const defaultProfileId = remapExportId(host.defaultProfileId, profileIdMap);
    if (relatedHostIds.length === 0 &&
        gatewayHostId === null &&
        defaultProfileId === null) {
        return null;
    }
    return {
        exportId: host.exportId,
        patch: {
            relatedHostIds,
            gatewayHostId,
            defaultProfileId
        }
    };
}
export function profileCreateFromExportItem(profile, hostIdMap) {
    return {
        exportId: profile.exportId,
        input: {
            name: profile.name,
            protocol: profile.protocol,
            shell: profile.shell,
            username: profile.username,
            authMethod: profile.authMethod,
            credentialRef: profile.credentialRef,
            jumpHostId: remapExportId(profile.jumpHostId, hostIdMap),
            extra: profile.extra
        }
    };
}
export function resolveHostProfileLink(link, hostIdMap, profileIdMap) {
    const hostId = hostIdMap.get(link.hostId);
    const profileId = profileIdMap.get(link.profileId);
    if (!hostId || !profileId)
        return null;
    return { hostId, profileId };
}
