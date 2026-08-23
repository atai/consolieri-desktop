import { Modal } from '../ui/Modal'
import { DialogHeader } from '../ui/DialogHeader'
import { Button } from '../ui/Button'
import type { ControlConfirmDecision, ControlConfirmRequest } from '@shared/types'

export interface ControlConfirmDialogProps {
  request: ControlConfirmRequest
  onDecide: (decision: ControlConfirmDecision) => void
}

export function ControlConfirmDialog({
  request,
  onDecide
}: ControlConfirmDialogProps): React.JSX.Element {
  return (
    <Modal size="lg" scrollable onClose={() => onDecide('deny')}>
      <DialogHeader title="Allow external window?" onClose={() => onDecide('deny')} bordered />
      <div className="space-y-4 px-4 py-3 text-sm text-fg">
        <p className="text-muted">
          Client <span className="font-medium text-fg">{request.clientName}</span> wants to open a
          mosaic window.
        </p>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted">Title</p>
          <p className="font-medium">{request.title}</p>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Panes</p>
          <div className="overflow-x-auto rounded border border-border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-raised text-muted">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Title</th>
                  <th className="px-2 py-1.5 font-medium">Shell</th>
                  <th className="px-2 py-1.5 font-medium">cwd</th>
                  <th className="px-2 py-1.5 font-medium">command</th>
                </tr>
              </thead>
              <tbody>
                {request.panes.map((pane, index) => (
                  <tr key={`${pane.title}-${index}`} className="border-t border-border">
                    <td className="px-2 py-1.5 align-top">{pane.title}</td>
                    <td className="px-2 py-1.5 align-top">{pane.localShell ?? 'default'}</td>
                    <td className="max-w-[14rem] truncate px-2 py-1.5 align-top font-mono">
                      {pane.cwd}
                    </td>
                    <td className="max-w-[12rem] truncate px-2 py-1.5 align-top font-mono text-danger">
                      {pane.command ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {request.hasCommand && (
          <p className="text-xs text-danger">
            One or more panes include a command. This always requires confirmation and cannot be
            permanently trusted.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="ghost" size="md" onClick={() => onDecide('deny')}>
          Deny
        </Button>
        {!request.hasCommand && (
          <Button type="button" variant="default" size="md" onClick={() => onDecide('always_allow')}>
            Always allow this client
          </Button>
        )}
        <Button type="button" variant="primary" size="md" onClick={() => onDecide('allow_once')}>
          Allow once
        </Button>
      </div>
    </Modal>
  )
}
