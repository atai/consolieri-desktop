import type { ReactNode } from 'react'

interface MosaicToolbarButtonProps {
  label: string
  title: string
  onClick: () => void
  className?: string
  icon: ReactNode
  variant?: 'default' | 'danger'
}

export function MosaicToolbarButton({
  label,
  title,
  onClick,
  className = '',
  icon,
  variant = 'default'
}: MosaicToolbarButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`mosaic-toolbar-btn ${variant === 'danger' ? 'mosaic-toolbar-btn-danger' : ''} ${className}`.trim()}
    >
      <span className="mosaic-toolbar-btn-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="mosaic-toolbar-btn-label">{label}</span>
    </button>
  )
}
