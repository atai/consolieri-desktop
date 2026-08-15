import type { ReactNode } from 'react'

interface MosaicToolbarButtonProps {
  label: string
  title: string
  onClick: () => void
  className?: string
  icon: ReactNode
  variant?: 'default' | 'danger'
  /** Hide the text label; keep title/aria for accessibility. */
  iconOnly?: boolean
}

export function MosaicToolbarButton({
  label,
  title,
  onClick,
  className = '',
  icon,
  variant = 'default',
  iconOnly = false
}: MosaicToolbarButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onClick={onClick}
      className={`mosaic-toolbar-btn ${iconOnly ? 'mosaic-toolbar-btn-icon-only' : ''} ${variant === 'danger' ? 'mosaic-toolbar-btn-danger' : ''} ${className}`.trim()}
    >
      <span className="mosaic-toolbar-btn-icon" aria-hidden="true">
        {icon}
      </span>
      {!iconOnly && <span className="mosaic-toolbar-btn-label">{label}</span>}
    </button>
  )
}
