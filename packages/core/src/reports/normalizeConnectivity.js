import { isNonEmptyString, normalizeHostEntries, normalizeHostResultBase } from './normalizeCommon';
export function normalizeConnectivityTestConfig(input) {
    if (typeof input !== 'object' || input === null) {
        return { type: 'connectivity_test', entries: [] };
    }
    const raw = input;
    return {
        type: 'connectivity_test',
        entries: normalizeHostEntries(raw.entries)
    };
}
function normalizePingStatus(value) {
    if (value === 'ok' || value === 'fail')
        return value;
    return undefined;
}
function normalizeConnectivityHostResult(raw) {
    const base = normalizeHostResultBase(raw);
    if (!base)
        return null;
    const entry = raw;
    const result = { ...base };
    const pingStatus = normalizePingStatus(entry.pingStatus);
    if (pingStatus)
        result.pingStatus = pingStatus;
    if (typeof entry.pingDurationMs === 'number' && entry.pingDurationMs >= 0) {
        result.pingDurationMs = entry.pingDurationMs;
    }
    if (isNonEmptyString(entry.pingError))
        result.pingError = entry.pingError;
    if (typeof entry.httpStatusCode === 'number' &&
        entry.httpStatusCode >= 100 &&
        entry.httpStatusCode <= 599) {
        result.httpStatusCode = entry.httpStatusCode;
    }
    if (typeof entry.httpDurationMs === 'number' && entry.httpDurationMs >= 0) {
        result.httpDurationMs = entry.httpDurationMs;
    }
    if (isNonEmptyString(entry.httpError))
        result.httpError = entry.httpError;
    return result;
}
export function normalizeConnectivityTestResult(input) {
    if (typeof input !== 'object' || input === null)
        return null;
    const raw = input;
    if (!isNonEmptyString(raw.runAt))
        return null;
    const entries = Array.isArray(raw.entries)
        ? raw.entries
            .map(normalizeConnectivityHostResult)
            .filter((e) => e !== null)
        : [];
    return { type: 'connectivity_test', runAt: raw.runAt, entries };
}
