import { isNonEmptyString, normalizeHostEntries, normalizeHostResultBase } from './normalizeCommon';
function normalizeInventoryHostData(raw) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const data = raw;
    if (!isNonEmptyString(data.os) || !isNonEmptyString(data.cpu))
        return null;
    if (typeof data.ramBytes !== 'number' || data.ramBytes < 0)
        return null;
    const hostnames = Array.isArray(data.hostnames)
        ? data.hostnames.filter((h) => isNonEmptyString(h))
        : [];
    const ipv4 = Array.isArray(data.ipv4)
        ? data.ipv4.filter((ip) => isNonEmptyString(ip))
        : [];
    const ipv6 = Array.isArray(data.ipv6)
        ? data.ipv6.filter((ip) => isNonEmptyString(ip))
        : [];
    return { os: data.os, ramBytes: data.ramBytes, cpu: data.cpu, hostnames, ipv4, ipv6 };
}
export function normalizeInventoryConfig(input) {
    if (typeof input !== 'object' || input === null) {
        return { type: 'inventory', entries: [] };
    }
    const raw = input;
    return {
        type: 'inventory',
        entries: normalizeHostEntries(raw.entries)
    };
}
function normalizeInventoryHostResult(raw) {
    const base = normalizeHostResultBase(raw);
    if (!base)
        return null;
    const result = { ...base };
    if (typeof raw === 'object' && raw !== null) {
        const entry = raw;
        if (entry.inventory) {
            const inventory = normalizeInventoryHostData(entry.inventory);
            if (inventory)
                result.inventory = inventory;
        }
    }
    return result;
}
export function normalizeInventoryResult(input) {
    if (typeof input !== 'object' || input === null)
        return null;
    const raw = input;
    if (!isNonEmptyString(raw.runAt))
        return null;
    const entries = Array.isArray(raw.entries)
        ? raw.entries
            .map(normalizeInventoryHostResult)
            .filter((e) => e !== null)
        : [];
    return { type: 'inventory', runAt: raw.runAt, entries };
}
