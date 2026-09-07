import { hostsPerTag, primaryTagForHost } from '../graphUtils';
import { getMapNodeCollisionRadius } from '../nodeSizes';
const HOST_GAP = 8;
const CLUSTER_PADDING = 16;
export function orbitRadiusForHostCount(hostCount) {
    const hostRadius = getMapNodeCollisionRadius('host');
    const tagRadius = getMapNodeCollisionRadius('tag');
    const minOrbit = tagRadius + hostRadius;
    if (hostCount <= 1)
        return minOrbit;
    const ringOrbit = (hostRadius * 2 + HOST_GAP) / (2 * Math.sin(Math.PI / hostCount));
    return Math.max(minOrbit, ringOrbit);
}
function boundingRadiusForCluster(orbitRadius, hostCount) {
    const tagRadius = getMapNodeCollisionRadius('tag');
    const hostRadius = getMapNodeCollisionRadius('host');
    if (hostCount === 0)
        return tagRadius + CLUSTER_PADDING;
    return orbitRadius + hostRadius + CLUSTER_PADDING;
}
export function estimateTagClusters(graph) {
    const perTag = hostsPerTag(graph);
    const metrics = new Map();
    for (const [tagId, hostIds] of perTag) {
        const primaryHosts = hostIds.filter((id) => primaryTagForHost(id, graph) === tagId);
        const orbitRadius = orbitRadiusForHostCount(primaryHosts.length);
        metrics.set(tagId, {
            tagId,
            hostIds: primaryHosts,
            orbitRadius,
            boundingRadius: boundingRadiusForCluster(orbitRadius, primaryHosts.length)
        });
    }
    for (const node of graph.nodes) {
        if (node.kind !== 'tag' || metrics.has(node.id))
            continue;
        const orbitRadius = orbitRadiusForHostCount(0);
        metrics.set(node.id, {
            tagId: node.id,
            hostIds: [],
            orbitRadius,
            boundingRadius: boundingRadiusForCluster(orbitRadius, 0)
        });
    }
    return metrics;
}
