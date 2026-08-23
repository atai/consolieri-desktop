import type { Report } from '@shared/types'
import { HostEntriesReportForm } from './HostEntriesReportForm'

interface ConnectivityReportFormProps {
  report?: Report
  onSave: () => void | Promise<void>
  onCancel: () => void
}

export function ConnectivityReportForm({
  report,
  onSave,
  onCancel
}: ConnectivityReportFormProps): React.JSX.Element {
  return (
    <HostEntriesReportForm
      reportType="connectivity_test"
      title={report ? 'Edit connectivity test' : 'New connectivity test'}
      report={report}
      onSave={onSave}
      onCancel={onCancel}
    />
  )
}
