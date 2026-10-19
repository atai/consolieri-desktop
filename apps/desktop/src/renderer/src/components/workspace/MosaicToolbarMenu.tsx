import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { TOOLBAR_MENU_MARGIN, placeToolbarMenu } from './placeToolbarMenu'

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

interface MenuPosition {
  top: number
  left: number
}

export function MosaicToolbarMenu({
  label,
  title,
  icon,
  items,
  className = ''
}: MosaicToolbarMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent): void => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useLayoutEffect(() => {
    if (!open) return

    const update = (): void => {
      const anchor = rootRef.current?.getBoundingClientRect()
      const menu = menuRef.current
      if (!anchor || !menu) return
      const left = placeToolbarMenu(
        { left: anchor.left, right: anchor.right },
        menu.offsetWidth,
        window.innerWidth
      )
      const next = { top: anchor.bottom + TOOLBAR_MENU_MARGIN, left }
      setPosition((current) =>
        current && current.top === next.top && current.left === next.left ? current : next
      )
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
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
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
            className={`fixed z-30 min-w-[10rem] overflow-hidden rounded border border-border bg-surface shadow-lg ${
              position ? '' : 'invisible'
            }`}
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
          </div>,
          document.body
        )}
    </div>
  )
}
