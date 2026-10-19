function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function paneHostId(pane) {
    if (!isRecord(pane) || !isRecord(pane.connectRequest))
        return null;
    return typeof pane.connectRequest.hostId === 'string' ? pane.connectRequest.hostId : null;
}
function sharedHostId(panes) {
    const ids = new Set();
    for (const pane of panes) {
        const hostId = paneHostId(pane);
        if (hostId)
            ids.add(hostId);
    }
    return ids.size === 1 ? [...ids][0] : null;
}
function paneTitle(pane) {
    if (!isRecord(pane))
        return null;
    if (typeof pane.title === 'string' && pane.title.trim())
        return pane.title;
    if (isRecord(pane.connectRequest) &&
        typeof pane.connectRequest.title === 'string' &&
        pane.connectRequest.title.trim()) {
        return pane.connectRequest.title;
    }
    return null;
}
function tabTitle(panes, hostId) {
    for (const pane of panes) {
        const title = paneTitle(pane);
        if (title)
            return title;
    }
    return hostId ? 'Session' : 'Local';
}
function normalizeTab(raw, createId) {
    if (!isRecord(raw))
        return null;
    const panes = Array.isArray(raw.panes) ? raw.panes : [];
    const hostId = typeof raw.hostId === 'string' ? raw.hostId : sharedHostId(panes);
    return {
        id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
        hostId,
        title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : tabTitle(panes, hostId),
        layout: raw.layout ?? null,
        panes
    };
}
export function migrateWorkspaceState(raw, createId) {
    if (!isRecord(raw))
        return { tabs: [], activeTabId: null };
    if (Array.isArray(raw.tabs)) {
        const tabs = raw.tabs.map((item) => normalizeTab(item, createId)).filter((tab) => tab !== null);
        const requested = typeof raw.activeTabId === 'string' ? raw.activeTabId : null;
        const activeTabId = tabs.some((tab) => tab.id === requested) ? requested : (tabs[0]?.id ?? null);
        return { tabs, activeTabId };
    }
    if (!('layout' in raw) && !('panes' in raw))
        return { tabs: [], activeTabId: null };
    const panes = Array.isArray(raw.panes) ? raw.panes : [];
    if (panes.length === 0 && raw.layout == null)
        return { tabs: [], activeTabId: null };
    const hostId = sharedHostId(panes);
    const id = createId();
    return {
        tabs: [
            {
                id,
                hostId,
                title: tabTitle(panes, hostId),
                layout: raw.layout ?? null,
                panes
            }
        ],
        activeTabId: id
    };
}
