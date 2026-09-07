import type { Host } from '../types';
export declare const HOST_LIST_VIEW_VERSION = 1;
export type HostListGroupBy = 'none' | 'tag' | 'osType';
export type HostListSortBy = 'name' | 'hostname';
export type HostListSortDir = 'asc' | 'desc';
export type HostListGroupFilter = string | null | 'all';
export interface HostListViewSettings {
    version: number;
    groupBy: HostListGroupBy;
    selectedTags: string[];
    selectedGroupId: HostListGroupFilter;
    selectedHostId: string | null;
    collapsedSections: string[];
    sortBy: HostListSortBy;
    sortDir: HostListSortDir;
}
export interface HostListSection {
    id: string;
    label: string;
    hosts: Host[];
}
export declare const DEFAULT_HOST_LIST_VIEW: HostListViewSettings;
export declare function normalizeHostListViewSettings(input: unknown): HostListViewSettings;
export declare function parseHostListViewJson(raw: string | undefined | null): HostListViewSettings;
export declare function mergeHostListViewSettings(current: HostListViewSettings, patch: Partial<HostListViewSettings>): HostListViewSettings;
export declare function sortHostListSections(sections: HostListSection[], sortDir?: HostListSortDir): HostListSection[];
export declare function sortHosts(hosts: Host[], sortBy?: HostListSortBy, sortDir?: HostListSortDir): Host[];
export declare function groupHostsByTag(hosts: Host[], sectionSortDir?: HostListSortDir): HostListSection[];
export declare function groupHostsByOsType(hosts: Host[], sectionSortDir?: HostListSortDir): HostListSection[];
export declare function buildHostListSections(hosts: Host[], groupBy: HostListGroupBy, sortBy?: HostListSortBy, sortDir?: HostListSortDir): HostListSection[];
export declare function hostListViewToGroupFilter(selectedGroupId: HostListGroupFilter): string | null | undefined;
