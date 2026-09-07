export function insertPaneIntoLayout(current, paneId, direction = 'row') {
    if (!current)
        return paneId;
    if (typeof current === 'string') {
        return { type: 'split', direction, children: [current, paneId] };
    }
    if (current.type === 'tabs') {
        return { type: 'split', direction, children: [current, paneId] };
    }
    return { type: 'split', direction, children: [current, paneId] };
}
export function removeFromLayout(node, paneId) {
    if (typeof node === 'string') {
        return node === paneId ? null : node;
    }
    if (node.type === 'tabs') {
        const tabs = node.tabs.filter((t) => t !== paneId);
        if (tabs.length === 0)
            return null;
        if (tabs.length === 1)
            return tabs[0];
        const activeTab = tabs.includes(node.activeTab) ? node.activeTab : tabs[0];
        return { type: 'tabs', tabs, activeTab };
    }
    const split = node;
    const children = split.children
        .map((c) => removeFromLayout(c, paneId))
        .filter((c) => c !== null);
    if (children.length === 0)
        return null;
    if (children.length === 1)
        return children[0];
    return { ...split, children };
}
export function splitPaneInLayout(node, targetPaneId, newPaneId, direction, splitPercentages = [50, 50]) {
    if (typeof node === 'string') {
        if (node !== targetPaneId)
            return node;
        return {
            type: 'split',
            direction,
            children: [targetPaneId, newPaneId],
            splitPercentages
        };
    }
    if (node.type === 'tabs') {
        return node;
    }
    const split = node;
    const children = split.children.map((child) => splitPaneInLayout(child, targetPaneId, newPaneId, direction, splitPercentages));
    const changed = children.some((child, i) => child !== split.children[i]);
    if (!changed)
        return node;
    return { ...split, children: children };
}
