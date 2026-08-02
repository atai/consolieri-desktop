import { summarizeReportResult } from '@consoleri/core'
import type { Report } from '@shared/types'

interface ReportListItemProps {
  report: Report
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

function reportTypeLabel(type: Report['type']): string {
  switch (type) {
    case 'connectivity_test':
      return 'Connectivity test'
    case 'inventory':
      return 'Inventory'
    case 'custom_test':
      return 'Custom test'
    default:
      return type
  }
}

function hostCount(report: Report): number {
  return report.config.entries.length
}

function summarizeResult(report: Report): string | null {
  if (!report.lastResult) return null
  return summarizeReportResult(report.lastResult)
}

export function ReportListItem({
  report,
  onOpen,
  onEdit,
  onDelete
}: ReportListItemProps): React.JSX.Element {
  const hosts = hostCount(report)
  const summary = summarizeResult(report)

  return (
    <li className="flex items-center gap-2 border-b border-border px-3 py-2 hover:bg-surface-raised">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium text-fg">{report.name}</div>
        <div className="mt-0.5 text-xs text-muted">
          {reportTypeLabel(report.type)} · {hosts} host{hosts === 1 ? '' : 's'}
          {report.lastRunAt && <> · {new Date(report.lastRunAt).toLocaleString()}</>}
          {summary && <> · {summary}</>}
        </div>
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded px-2 py-0.5 text-xs text-muted hover:bg-border hover:text-fg"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded px-2 py-0.5 text-xs text-danger hover:bg-border"
      >
        Delete
      </button>
    </li>
  )
}
