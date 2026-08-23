import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MosaicToolbarMenuItem {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
}

interface MosaicToolbarMenuProps {
  label: string
  title: string
  icon: ReactNode
  items: MosaicToolbarMenuItem[]
  className?: string
}

export function MosaicToolbarMenu({
  label,
  title,
  icon,
  items,
  className = ''
}: MosaicToolbarMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const run = (action: () => void): void => {
    setOpen(false)
    action()
  }

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        title={title}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="mosaic-toolbar-btn"
      >
        <span className="mosaic-toolbar-btn-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="mosaic-toolbar-btn-label">{label}</span>
        <span className="mosaic-toolbar-btn-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-0.5 min-w-[10rem] overflow-hidden rounded border border-border bg-surface shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => run(item.onClick)}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-fg hover:bg-surface-raised"
            >
              {item.icon && (
                <span className="mosaic-toolbar-btn-icon shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
