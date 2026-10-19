export const DEFAULT_COMMAND_HISTORY_LIMIT = 200
export const MAX_COMMAND_HISTORY_LIMIT = 2000

export function clampCommandHistoryLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_COMMAND_HISTORY_LIMIT
  const n = Math.trunc(value)
  if (n < 0) return 0
  if (n > MAX_COMMAND_HISTORY_LIMIT) return MAX_COMMAND_HISTORY_LIMIT
  return n
}

/** Last `limit` non-empty lines of a shell HISTFILE. Multiline entries stay as stored. */
export function tailShellHistory(content: string, limit: number): string[] {
  const clamped = clampCommandHistoryLimit(limit)
  if (clamped === 0 || content.length === 0) return []
  const lines = content.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length <= clamped) return lines
  return lines.slice(-clamped)
}

/** HISTFILE body written when a pane is restored and its history file does not exist yet. */
export function shellHistorySeed(lines: readonly string[] | undefined): string {
  if (!lines || lines.length === 0) return ''
  return `${lines.join('\n')}\n`
}
