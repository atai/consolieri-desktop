export const HTTP_TIMEOUT_MS = 10000

export type HttpStatusTone = 'success' | 'error' | 'warning' | 'none'

export function classifyHttpStatus(
  statusCode: number | undefined,
  error?: string
): HttpStatusTone {
  if (statusCode !== undefined) {
    if (statusCode >= 200 && statusCode < 300) return 'success'
    if (statusCode >= 400 && statusCode < 600) return 'error'
    return 'warning'
  }
  if (error) return 'warning'
  return 'none'
}

export function formatHttpStatusLabel(
  statusCode: number | undefined,
  error?: string
): string {
  if (statusCode !== undefined) return String(statusCode)
  if (error) return 'ERR'
  return '—'
}

export function httpStatusTailwindClass(tone: HttpStatusTone): string {
  switch (tone) {
    case 'success':
      return 'text-success'
    case 'error':
      return 'text-danger'
    case 'warning':
      return 'text-warn'
    default:
      return 'text-muted'
  }
}

export function connectivityResultHasHttpColumn(
  entries: Array<{ httpStatusCode?: number; httpError?: string }>
): boolean {
  return entries.some((e) => e.httpStatusCode !== undefined || e.httpError !== undefined)
}
