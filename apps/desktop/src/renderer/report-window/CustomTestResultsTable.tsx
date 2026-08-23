import { Fragment, useState } from 'react'
import type { CustomTestResult } from '@shared/types'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function statusBadge(status: string): string {
  switch (status) {
    case 'ok':
      return 'text-success'
    case 'skipped':
      return 'text-warn'
    default:
      return 'text-danger'
  }
}

function exitCodeClass(code: number | null, status: string): string {
  if (status === 'skipped' || code === null) return 'text-warn'
  if (code === 0) return 'text-success'
  return 'text-danger'
}

function commandSummary(entry: CustomTestResult['entries'][number]): string {
  const total = entry.commands.length
  if (total === 0) return '—'
  const ok = entry.commands.filter((c) => c.status === 'ok').length
  const skipped = entry.commands.filter((c) => c.status === 'skipped').length
  if (skipped > 0) {
    return `${ok}/${total} ok (${skipped} skipped)`
  }
  return `${ok}/${total} ok`
}

function formatOutputPreview(stdout: string, stderr: string, maxLen = 120): string {
  const parts: string[] = []
  if (stdout.trim()) parts.push(stdout.trim())
  if (stderr.trim()) parts.push(`stderr: ${stderr.trim()}`)
  const combined = parts.join('\n')
  if (!combined) return '—'
  if (combined.length <= maxLen) return combined
  return `${combined.slice(0, maxLen)}…`
}

interface CustomTestResultsTableProps {
  result: CustomTestResult
  hostName: (hostId: string) => string
  profileName: (profileId: string) => string
}

export function CustomTestResultsTable({
  result,
  hostName,
  profileName
}: CustomTestResultsTableProps): React.JSX.Element {
  const [expandedHostId, setExpandedHostId] = useState<string | null>(null)
  const [expandedOutputKey, setExpandedOutputKey] = useState<string | null>(null)

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-border text-xs uppercase text-muted">
          <th className="px-3 py-2 font-medium">Host</th>
          <th className="px-3 py-2 font-medium">Profile</th>
          <th className="px-3 py-2 font-medium">Status</th>
          <th className="px-3 py-2 font-medium">Commands</th>
          <th className="px-3 py-2 font-medium">Duration</th>
          <th className="px-3 py-2 font-medium">Details</th>
        </tr>
      </thead>
      <tbody>
        {result.entries.map((entry) => {
          const rowKey = `${entry.hostId}-${entry.profileId}`
          const expanded = expandedHostId === rowKey
          const hasDetails =
            entry.commands.length > 0 || entry.error || (entry.log && entry.log.length > 0)
          return (
            <Fragment key={rowKey}>
              <tr className="border-b border-border">
                <td className="px-3 py-2 text-sm text-fg">{hostName(entry.hostId)}</td>
                <td className="px-3 py-2 text-sm text-muted">{profileName(entry.profileId)}</td>
                <td
                  className={`px-3 py-2 text-sm font-medium uppercase ${statusBadge(entry.status)}`}
                >
                  {entry.status}
                </td>
                <td className="px-3 py-2 text-sm text-fg-2">{commandSummary(entry)}</td>
                <td className="px-3 py-2 text-sm text-muted">{formatDuration(entry.durationMs)}</td>
                <td className="px-3 py-2 text-sm">
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => setExpandedHostId(expanded ? null : rowKey)}
                      className="text-xs text-accent hover:underline"
                    >
                      {expanded ? 'Hide' : 'Show'}
                    </button>
                  )}
                </td>
              </tr>
              {expanded && hasDetails && (
                <tr className="bg-surface">
                  <td colSpan={6} className="px-3 py-2">
                    {entry.error && (
                      <p className="mb-2 text-xs text-danger">ERROR: {entry.error}</p>
                    )}
                    {entry.log && entry.log.length > 0 && (
                      <pre className="mb-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-muted">
                        {entry.log.join('\n')}
                      </pre>
                    )}
                    {entry.commands.length > 0 && (
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted">
                            <th className="px-2 py-1 font-medium">#</th>
                            <th className="px-2 py-1 font-medium">Command</th>
                            <th className="px-2 py-1 font-medium">Exit</th>
                            <th className="px-2 py-1 font-medium">Status</th>
                            <th className="px-2 py-1 font-medium">Duration</th>
                            <th className="px-2 py-1 font-medium">Output</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.commands.map((cmd) => {
                            const outputKey = `${rowKey}-${cmd.index}`
                            const outputExpanded = expandedOutputKey === outputKey
                            const preview = formatOutputPreview(cmd.stdout, cmd.stderr)
                            const fullOutput = formatOutputPreview(cmd.stdout, cmd.stderr, Infinity)
                            const hasOutput = preview !== '—'
                            return (
                              <tr key={cmd.index} className="border-b border-border last:border-0">
                                <td className="px-2 py-1.5 text-xs text-muted">{cmd.index + 1}</td>
                                <td className="max-w-[240px] truncate px-2 py-1.5 font-mono text-xs text-fg-2">
                                  {cmd.command}
                                </td>
                                <td
                                  className={`px-2 py-1.5 font-mono text-xs ${exitCodeClass(cmd.code, cmd.status)}`}
                                >
                                  {cmd.code !== null ? cmd.code : '—'}
                                </td>
                                <td
                                  className={`px-2 py-1.5 text-xs font-medium uppercase ${statusBadge(cmd.status)}`}
                                >
                                  {cmd.status}
                                </td>
                                <td className="px-2 py-1.5 text-xs text-muted">
                                  {cmd.status === 'skipped' ? '—' : formatDuration(cmd.durationMs)}
                                </td>
                                <td className="px-2 py-1.5 text-xs">
                                  {hasOutput ? (
                                    <div>
                                      {!outputExpanded && (
                                        <span className="font-mono text-muted">{preview}</span>
                                      )}
                                      {outputExpanded && (
                                        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-muted">
                                          {fullOutput}
                                        </pre>
                                      )}
                                      {fullOutput.length > 120 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedOutputKey(outputExpanded ? null : outputKey)
                                          }
                                          className="ml-1 text-accent hover:underline"
                                        >
                                          {outputExpanded ? 'Hide' : 'Show'}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          )
        })}
      </tbody>
    </table>
  )
}
