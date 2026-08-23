import { Button } from './Button'
import { ConfirmDeleteButton } from './ConfirmDeleteButton'

export interface EditDeleteActionsProps {
  onEdit: () => void
  onDelete: () => void | Promise<void>
  onCopy?: () => void
  editLabel?: string
  copyLabel?: string
  deleteLabel?: string
  confirmDeleteLabel?: string
  disabled?: boolean
  className?: string
}

export function EditDeleteActions({
  onEdit,
  onDelete,
  onCopy,
  editLabel = 'Edit',
  copyLabel = 'Copy',
  deleteLabel = 'Delete',
  confirmDeleteLabel = 'Delete',
  disabled = false,
  className = ''
}: EditDeleteActionsProps): React.JSX.Element {
  return (
    <div className={`flex shrink-0 items-center gap-1 ${className}`}>
      <Button variant="default" size="sm" disabled={disabled} onClick={onEdit}>
        {editLabel}
      </Button>
      {onCopy && (
        <Button variant="default" size="sm" disabled={disabled} onClick={onCopy}>
          {copyLabel}
        </Button>
      )}
      <ConfirmDeleteButton
        label={deleteLabel}
        confirmLabel={confirmDeleteLabel}
        disabled={disabled}
        onConfirm={onDelete}
        variant="default"
      />
    </div>
  )
}
