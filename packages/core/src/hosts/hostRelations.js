export function normalizeRelatedHostIds(hostId, relatedHostIds, existingHostIds) {
    if (!relatedHostIds?.length)
        return [];
    const seen = new Set();
    const result = [];
    for (const id of relatedHostIds) {
        const trimmed = id.trim();
        if (!trimmed || trimmed === hostId || seen.has(trimmed))
            continue;
        if (!existingHostIds.has(trimmed))
            continue;
        seen.add(trimmed);
        result.push(trimmed);
    }
    return result;
}
export function normalizeGatewayHostId(hostId, gatewayHostId, existingHosts) {
    if (!gatewayHostId || gatewayHostId === hostId)
        return null;
    const target = existingHosts.find((h) => h.id === gatewayHostId);
    if (!target)
        return null;
    if (target.gatewayHostId === hostId)
        return null;
    return gatewayHostId;
}
