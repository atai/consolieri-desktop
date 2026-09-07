export function resolveOverlaps(nodes, radiusFor, options) {
    const fixedKinds = new Set(options?.fixedKinds ?? ['tag']);
    const fixed = nodes.filter((n) => fixedKinds.has(n.kind));
    const movable = nodes.filter((n) => !fixedKinds.has(n.kind));
    const maxIterations = options?.maxIterations ?? 80;
    for (let iter = 0; iter < maxIterations; iter++) {
        let moved = false;
        for (let i = 0; i < movable.length; i++) {
            for (let j = i + 1; j < movable.length; j++) {
                if (separatePair(movable[i], movable[j], radiusFor, 0.5))
                    moved = true;
            }
        }
        for (const anchor of fixed) {
            for (const node of movable) {
                if (separatePair(anchor, node, radiusFor, 1))
                    moved = true;
            }
        }
        if (!moved)
            break;
    }
}
function separatePair(a, b, radiusFor, movableShare) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    if (dist < 0.001) {
        const angle = ((a.id.length + b.id.length) % 8) * (Math.PI / 4);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        dist = 1;
    }
    const minDist = radiusFor(a) + radiusFor(b);
    if (dist >= minDist)
        return false;
    const push = (minDist - dist) * movableShare;
    const nx = dx / dist;
    const ny = dy / dist;
    if (movableShare >= 1) {
        b.x += nx * push;
        b.y += ny * push;
    }
    else {
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
    }
    return true;
}
