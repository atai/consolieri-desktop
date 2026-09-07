export const MAP_VIEW_VERSION = 1;
export const DEFAULT_MAP_VIEW = {
    version: MAP_VIEW_VERSION,
    appView: 'list',
    mapMode: 'logical'
};
export function normalizeMapViewSettings(input) {
    if (typeof input !== 'object' || input === null) {
        return { ...DEFAULT_MAP_VIEW };
    }
    const raw = input;
    // Migrate legacy values: 'profile' and 'vault' collapse to 'settings'
    const rawView = raw.appView;
    const appView = rawView === 'map' ||
        rawView === 'list' ||
        rawView === 'reports' ||
        rawView === 'settings'
        ? rawView
        : rawView === 'profile' || rawView === 'vault'
            ? 'settings'
            : DEFAULT_MAP_VIEW.appView;
    const mapMode = raw.mapMode === 'network' || raw.mapMode === 'logical'
        ? raw.mapMode
        : DEFAULT_MAP_VIEW.mapMode;
    return { version: MAP_VIEW_VERSION, appView, mapMode };
}
export function parseMapViewJson(raw) {
    if (!raw)
        return { ...DEFAULT_MAP_VIEW };
    try {
        return normalizeMapViewSettings(JSON.parse(raw));
    }
    catch {
        return { ...DEFAULT_MAP_VIEW };
    }
}
export function mergeMapViewSettings(current, patch) {
    return normalizeMapViewSettings({ ...current, ...patch, version: MAP_VIEW_VERSION });
}
