const NODE_SIZES = {
    host: { width: 150, height: 118 },
    gateway: { width: 150, height: 118 },
    tag: { width: 72, height: 72 }
};
const COLLISION_PADDING = 16;
export function getMapNodeSize(kind) {
    return NODE_SIZES[kind];
}
export function getMapNodeCollisionRadius(kind) {
    const { width, height } = NODE_SIZES[kind];
    return Math.max(width, height) / 2 + COLLISION_PADDING;
}
export function layoutCenterToTopLeft(centerX, centerY, kind) {
    const { width, height } = NODE_SIZES[kind];
    return { x: centerX - width / 2, y: centerY - height / 2 };
}
