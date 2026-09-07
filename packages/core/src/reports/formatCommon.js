export function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}
export function statusLabel(status) {
    switch (status) {
        case 'ok':
            return 'OK';
        case 'fail':
            return 'FAIL';
        case 'skipped':
            return 'SKIPPED';
        default:
            return status.toUpperCase();
    }
}
export function formatRunTimestamp(iso) {
    try {
        return new Date(iso).toLocaleString();
    }
    catch {
        return iso;
    }
}
export function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
export function joinList(items) {
    return items.length > 0 ? items.join(', ') : '—';
}
export function totalReportDurationMs(entries) {
    return entries.reduce((sum, entry) => sum + entry.durationMs, 0);
}
