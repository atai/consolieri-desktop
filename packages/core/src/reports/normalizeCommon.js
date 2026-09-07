export function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
export function normalizeHostEntry(raw) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const entry = raw;
    if (!isNonEmptyString(entry.hostId) || !isNonEmptyString(entry.profileId))
        return null;
    return { hostId: entry.hostId, profileId: entry.profileId };
}
export function normalizeHostStatus(value) {
    if (value === 'ok' || value === 'fail' || value === 'skipped')
        return value;
    return 'fail';
}
export function normalizeHostResultBase(raw) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const entry = raw;
    if (!isNonEmptyString(entry.hostId) || !isNonEmptyString(entry.profileId))
        return null;
    const durationMs = typeof entry.durationMs === 'number' && entry.durationMs >= 0 ? entry.durationMs : 0;
    const result = {
        hostId: entry.hostId,
        profileId: entry.profileId,
        status: normalizeHostStatus(entry.status),
        durationMs
    };
    if (isNonEmptyString(entry.error))
        result.error = entry.error;
    if (Array.isArray(entry.log)) {
        result.log = entry.log.filter((line) => typeof line === 'string');
    }
    return result;
}
export function normalizeHostEntries(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.map(normalizeHostEntry).filter((e) => e !== null);
}
