/**
 * Pure path helpers — keep Electron-free for unit tests.
 *
 * No `node:path` import: this module is re-exported from the browser-facing
 * core entry, so it must stay bundler-safe. Node accepts forward slashes on
 * every platform, including Windows.
 */
function joinSegments(base: string, ...segments: string[]): string {
  const trimmedBase = base.replace(/[/\\]+$/, '')
  const rest = segments.map((s) => s.replace(/^[/\\]+|[/\\]+$/g, '')).filter((s) => s.length > 0)
  return [trimmedBase, ...rest].join('/')
}

export function shellHistoryDir(userData: string, hostId: string): string {
  return joinSegments(userData, 'shell-history', hostId)
}

export function shellHistoryFile(userData: string, hostId: string, paneId: string): string {
  return joinSegments(shellHistoryDir(userData, hostId), paneId)
}
