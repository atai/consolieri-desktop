/**
 * Pure path helpers — keep Electron-free for unit tests.
 *
 * No `node:path` import: this module is re-exported from the browser-facing
 * core entry, so it must stay bundler-safe. Node accepts forward slashes on
 * every platform, including Windows.
 */
function joinSegments(base, ...segments) {
    const trimmedBase = base.replace(/[/\\]+$/, '');
    const rest = segments.map((s) => s.replace(/^[/\\]+|[/\\]+$/g, '')).filter((s) => s.length > 0);
    return [trimmedBase, ...rest].join('/');
}
export function shellHistoryDir(userData, hostId) {
    return joinSegments(userData, 'shell-history', hostId);
}
export function shellHistoryFile(userData, hostId, paneId) {
    return joinSegments(shellHistoryDir(userData, hostId), paneId);
}
