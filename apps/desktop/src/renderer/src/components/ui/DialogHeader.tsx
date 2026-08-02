import type { ReactNode } from 'react'

export interface DialogHeaderProps {
  title: string
  subtitle?: ReactNode
  onClose?: () => void
  bordered?: boolean
}

export function DialogHeader({
  title,
  subtitle,
  onClose,
  bordered = false
}: DialogHeaderProps): React.JSX.Element {
  return (
    <div className={`shrink-0 p-4 ${bordered ? 'border-b border-border' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-fg">{title}</h3>
          {subtitle && <div className="mt-1 text-xs text-muted">{subtitle}</div>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted hover:text-fg"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
