export declare const MAP_VIEW_VERSION = 1;
export type MapViewMode = 'logical' | 'network';
export type AppView = 'list' | 'map' | 'settings' | 'reports';
export interface MapViewSettings {
    version: number;
    appView: AppView;
    mapMode: MapViewMode;
}
export declare const DEFAULT_MAP_VIEW: MapViewSettings;
export declare function normalizeMapViewSettings(input: unknown): MapViewSettings;
export declare function parseMapViewJson(raw: string | undefined | null): MapViewSettings;
export declare function mergeMapViewSettings(current: MapViewSettings, patch: Partial<MapViewSettings>): MapViewSettings;
