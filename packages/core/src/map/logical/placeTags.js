import { resolveOverlaps } from '../resolveOverlaps';
const TAG_MARGIN = 24;
export function placeTags(metrics, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const tagIds = [...metrics.keys()].sort();
    const result = new Map();
    if (tagIds.length === 0)
        return result;
    if (tagIds.length === 1) {
        result.set(tagIds[0], { x: centerX, y: centerY });
        return result;
    }
    const maxBounding = Math.max(...tagIds.map((id) => metrics.get(id).boundingRadius));
    const circleRadius = maxBounding + TAG_MARGIN;
    const points = tagIds.map((tagId, index) => {
        const angle = (2 * Math.PI * index) / tagIds.length - Math.PI / 2;
        return {
            id: tagId,
            kind: 'tag',
            x: centerX + circleRadius * Math.cos(angle),
            y: centerY + circleRadius * Math.sin(angle),
            collisionRadius: metrics.get(tagId).boundingRadius
        };
    });
    resolveOverlaps(points, (node) => node.collisionRadius, {
        fixedKinds: [],
        maxIterations: 120
    });
    const centroidX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const centroidY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const dx = centerX - centroidX;
    const dy = centerY - centroidY;
    for (const point of points) {
        result.set(point.id, { x: point.x + dx, y: point.y + dy });
    }
    return result;
}
