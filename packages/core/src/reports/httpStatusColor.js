export const HTTP_TIMEOUT_MS = 10000;
export function classifyHttpStatus(statusCode, error) {
    if (statusCode !== undefined) {
        if (statusCode >= 200 && statusCode < 300)
            return 'success';
        if (statusCode >= 400 && statusCode < 600)
            return 'error';
        return 'warning';
    }
    if (error)
        return 'warning';
    return 'none';
}
export function formatHttpStatusLabel(statusCode, error) {
    if (statusCode !== undefined)
        return String(statusCode);
    if (error)
        return 'ERR';
    return '—';
}
export function httpStatusTailwindClass(tone) {
    switch (tone) {
        case 'success':
            return 'text-success';
        case 'error':
            return 'text-danger';
        case 'warning':
            return 'text-warn';
        default:
            return 'text-muted';
    }
}
export function connectivityResultHasHttpColumn(entries) {
    return entries.some((e) => e.httpStatusCode !== undefined || e.httpError !== undefined);
}
