import { Fragment, useMemo, useState } from 'react'
import { classifyHttpStatus, formatHttpStatusLabel, httpStatusTailwindClass } from '@consoleri/core'
import type { ConnectivityTestResult, Host } from '@shared/types'

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

function formatPingStatus(pingStatus: string | undefined): string {
  if (!pingStatus) return '—'
  return pingStatus
}

interface ConnectivityResultsTableProps {
  result: ConnectivityTestResult
  hostById: Map<string, Host>
  hostName: (hostId: string) => string
  profileName: (profileId: string) => string
}

export function ConnectivityResultsTable({
  result,
  hostById,
  hostName,
  profileName
}: ConnectivityResultsTableProps): React.JSX.Element {
  const [expandedHostId, setExpandedHostId] = useState<string | null>(null)

  const showHttpColumn = useMemo(
    () => result.entries.some((e) => hostById.get(e.hostId)?.httpEndpoint),
    [result.entries, hostById]
  )

  const columnCount = 6 + (showHttpColumn ? 1 : 0)

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-border text-xs uppercase text-muted">
          <th className="px-3 py-2 font-medium">Host</th>
          <th className="px-3 py-2 font-medium">Profile</th>
          <th className="px-3 py-2 font-medium">Ping</th>
          <th className="px-3 py-2 font-medium">SSH</th>
          {showHttpColumn && <th className="px-3 py-2 font-medium">HTTP</th>}
          <th className="px-3 py-2 font-medium">Duration</th>
          <th className="px-3 py-2 font-medium">Details</th>
        </tr>
      </thead>
      <tbody>
        {result.entries.map((entry) => {
          const expanded = expandedHostId === entry.hostId
          const hostHasHttpEndpoint = Boolean(hostById.get(entry.hostId)?.httpEndpoint)
          const httpTone = hostHasHttpEndpoint
            ? classifyHttpStatus(entry.httpStatusCode, entry.httpError)
            : 'none'
          const hasDetails =
            entry.error || entry.pingError || entry.httpError || (entry.log && entry.log.length > 0)
          return (
            <Fragment key={`${entry.hostId}-${entry.profileId}`}>
              <tr className="border-b border-border">
                <td className="px-3 py-2 text-sm text-fg">{hostName(entry.hostId)}</td>
                <td className="px-3 py-2 text-sm text-muted">{profileName(entry.profileId)}</td>
                <td
                  className={`px-3 py-2 text-sm font-medium uppercase ${
                    entry.pingStatus ? statusBadge(entry.pingStatus) : 'text-muted'
                  }`}
                >
                  {formatPingStatus(entry.pingStatus)}
                </td>
                <td
                  className={`px-3 py-2 text-sm font-medium uppercase ${statusBadge(entry.status)}`}
                >
                  {entry.status}
                </td>
                {showHttpColumn && (
                  <td
                    className={`px-3 py-2 text-sm font-medium ${httpStatusTailwindClass(httpTone)}`}
                  >
                    {hostHasHttpEndpoint
                      ? formatHttpStatusLabel(entry.httpStatusCode, entry.httpError)
                      : '—'}
                  </td>
                )}
                <td className="px-3 py-2 text-sm text-muted">{formatDuration(entry.durationMs)}</td>
                <td className="px-3 py-2 text-sm">
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => setExpandedHostId(expanded ? null : entry.hostId)}
                      className="text-xs text-accent hover:underline"
                    >
                      {expanded ? 'Hide' : 'Show log'}
                    </button>
                  )}
                </td>
              </tr>
              {expanded && hasDetails && (
                <tr className="bg-surface">
                  <td colSpan={columnCount} className="px-3 py-2">
                    {entry.pingError && (
                      <p className="mb-1 text-xs text-danger">PING ERROR: {entry.pingError}</p>
                    )}
                    {entry.httpError && (
                      <p className="mb-1 text-xs text-danger">HTTP ERROR: {entry.httpError}</p>
                    )}
                    {entry.error && (
                      <p className="mb-1 text-xs text-danger">SSH ERROR: {entry.error}</p>
                    )}
                    {entry.log && entry.log.length > 0 && (
                      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-muted">
                        {entry.log.join('\n')}
                      </pre>
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
