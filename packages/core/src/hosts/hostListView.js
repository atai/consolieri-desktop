export const HOST_LIST_VIEW_VERSION = 1;
export const DEFAULT_HOST_LIST_VIEW = {
    version: HOST_LIST_VIEW_VERSION,
    groupBy: 'none',
    selectedTags: [],
    selectedGroupId: 'all',
    selectedHostId: null,
    collapsedSections: [],
    sortBy: 'name',
    sortDir: 'asc'
};
const GROUP_BY_VALUES = ['none', 'tag', 'osType'];
const SORT_BY_VALUES = ['name', 'hostname'];
const SORT_DIR_VALUES = ['asc', 'desc'];
const OS_LABELS = {
    windows: 'Windows',
    linux: 'Linux',
    macos: 'macOS',
    unknown: 'Unknown'
};
const OS_ORDER = ['windows', 'linux', 'macos', 'unknown'];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function normalizeStringArray(value) {
    if (!Array.isArray(value))
        return [];
    const seen = new Set();
    const result = [];
    for (const item of value) {
        if (typeof item !== 'string')
            continue;
        const trimmed = item.trim();
        if (!trimmed || seen.has(trimmed))
            continue;
        seen.add(trimmed);
        result.push(trimmed);
    }
    return result;
}
function normalizeGroupBy(value) {
    return GROUP_BY_VALUES.includes(value)
        ? value
        : DEFAULT_HOST_LIST_VIEW.groupBy;
}
function normalizeSortBy(value) {
    return SORT_BY_VALUES.includes(value)
        ? value
        : DEFAULT_HOST_LIST_VIEW.sortBy;
}
function normalizeSortDir(value) {
    return SORT_DIR_VALUES.includes(value)
        ? value
        : DEFAULT_HOST_LIST_VIEW.sortDir;
}
function normalizeGroupFilter(value) {
    if (value === 'all' || value === null)
        return value;
    if (typeof value === 'string' && value.trim())
        return value.trim();
    return DEFAULT_HOST_LIST_VIEW.selectedGroupId;
}
function normalizeSelectedHostId(value) {
    if (value === null)
        return null;
    if (typeof value === 'string' && value.trim())
        return value.trim();
    return null;
}
function migrateHostListViewV0toV1(raw) {
    return { ...raw, version: 1 };
}
function migrateHostListViewSettings(raw) {
    let current = { ...raw };
    const version = typeof current.version === 'number' ? current.version : 0;
    if (version < 1) {
        current = migrateHostListViewV0toV1(current);
    }
    return current;
}
export function normalizeHostListViewSettings(input) {
    if (!isRecord(input)) {
        return { ...DEFAULT_HOST_LIST_VIEW };
    }
    const migrated = migrateHostListViewSettings(input);
    return {
        version: HOST_LIST_VIEW_VERSION,
        groupBy: normalizeGroupBy(migrated.groupBy),
        selectedTags: normalizeStringArray(migrated.selectedTags),
        selectedGroupId: normalizeGroupFilter(migrated.selectedGroupId),
        selectedHostId: normalizeSelectedHostId(migrated.selectedHostId),
        collapsedSections: normalizeStringArray(migrated.collapsedSections),
        sortBy: normalizeSortBy(migrated.sortBy),
        sortDir: normalizeSortDir(migrated.sortDir)
    };
}
export function parseHostListViewJson(raw) {
    if (!raw)
        return { ...DEFAULT_HOST_LIST_VIEW };
    try {
        return normalizeHostListViewSettings(JSON.parse(raw));
    }
    catch {
        return { ...DEFAULT_HOST_LIST_VIEW };
    }
}
export function mergeHostListViewSettings(current, patch) {
    return normalizeHostListViewSettings({ ...current, ...patch, version: HOST_LIST_VIEW_VERSION });
}
function compareLabels(a, b, sortDir) {
    const cmp = a.localeCompare(b, undefined, { sensitivity: 'base' });
    return sortDir === 'desc' ? -cmp : cmp;
}
export function sortHostListSections(sections, sortDir = DEFAULT_HOST_LIST_VIEW.sortDir) {
    const untagged = sections.filter((section) => section.id === 'untagged');
    const rest = sections.filter((section) => section.id !== 'untagged');
    const sorted = [...rest].sort((a, b) => compareLabels(a.label, b.label, sortDir));
    return [...sorted, ...untagged];
}
function compareHosts(a, b, sortBy, sortDir) {
    const fieldA = sortBy === 'hostname' ? a.hostname : a.name;
    const fieldB = sortBy === 'hostname' ? b.hostname : b.name;
    const cmp = fieldA.localeCompare(fieldB, undefined, { sensitivity: 'base' });
    return sortDir === 'desc' ? -cmp : cmp;
}
export function sortHosts(hosts, sortBy = DEFAULT_HOST_LIST_VIEW.sortBy, sortDir = DEFAULT_HOST_LIST_VIEW.sortDir) {
    return [...hosts].sort((a, b) => compareHosts(a, b, sortBy, sortDir));
}
export function groupHostsByTag(hosts, sectionSortDir = DEFAULT_HOST_LIST_VIEW.sortDir) {
    const tagMap = new Map();
    const untagged = [];
    for (const host of hosts) {
        if (host.tags.length === 0) {
            untagged.push(host);
            continue;
        }
        for (const tag of host.tags) {
            const bucket = tagMap.get(tag);
            if (bucket) {
                bucket.push(host);
            }
            else {
                tagMap.set(tag, [host]);
            }
        }
    }
    const sections = Array.from(tagMap.entries()).map(([tag, sectionHosts]) => ({
        id: `tag:${tag}`,
        label: `#${tag}`,
        hosts: sortHosts(sectionHosts, 'name', 'asc')
    }));
    if (untagged.length > 0) {
        sections.push({
            id: 'untagged',
            label: 'Untagged',
            hosts: sortHosts(untagged, 'name', 'asc')
        });
    }
    return sortHostListSections(sections, sectionSortDir);
}
export function groupHostsByOsType(hosts, sectionSortDir = DEFAULT_HOST_LIST_VIEW.sortDir) {
    const buckets = new Map();
    for (const os of OS_ORDER) {
        buckets.set(os, []);
    }
    for (const host of hosts) {
        buckets.get(host.osType)?.push(host);
    }
    const sections = OS_ORDER.flatMap((os) => {
        const sectionHosts = buckets.get(os) ?? [];
        if (sectionHosts.length === 0)
            return [];
        return [
            {
                id: `os:${os}`,
                label: OS_LABELS[os],
                hosts: sortHosts(sectionHosts, 'name', 'asc')
            }
        ];
    });
    return sortHostListSections(sections, sectionSortDir);
}
export function buildHostListSections(hosts, groupBy, sortBy = DEFAULT_HOST_LIST_VIEW.sortBy, sortDir = DEFAULT_HOST_LIST_VIEW.sortDir) {
    if (groupBy === 'tag') {
        return groupHostsByTag(hosts, sortDir);
    }
    if (groupBy === 'osType') {
        return groupHostsByOsType(hosts, sortDir);
    }
    return [
        {
            id: 'all',
            label: '',
            hosts: sortHosts(hosts, sortBy, sortDir)
        }
    ];
}
export function hostListViewToGroupFilter(selectedGroupId) {
    if (selectedGroupId === 'all')
        return undefined;
    return selectedGroupId;
}
