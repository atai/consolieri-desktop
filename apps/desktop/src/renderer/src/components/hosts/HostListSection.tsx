import type { Host } from '@shared/types'
import { HostListItem } from './HostListItem'

export interface HostListSectionProps {
  id: string
  label: string
  hosts: Host[]
  collapsed: boolean
  selectedHostId: string | null
  onToggleCollapsed: () => void
  onSelect: (hostId: string) => void
  onConnect: (host: Host) => void
  onEdit: (hostId: string) => void
  onCopy: (hostId: string) => void
  onDelete: (hostId: string) => void | Promise<void>
}

export function HostListSection({
  id,
  label,
  hosts,
  collapsed,
  selectedHostId,
  onToggleCollapsed,
  onSelect,
  onConnect,
  onEdit,
  onCopy,
  onDelete
}: HostListSectionProps): React.JSX.Element {
  if (hosts.length === 0) {
    return <></>
  }

  if (!label) {
    return (
      <ul>
        {hosts.map((host) => (
          <HostListItem
            key={host.id}
            host={host}
            selected={selectedHostId === host.id}
            onSelect={() => onSelect(host.id)}
            onConnect={() => onConnect(host)}
            onEdit={() => onEdit(host.id)}
            onCopy={() => onCopy(host.id)}
            onDelete={() => onDelete(host.id)}
          />
        ))}
      </ul>
    )
  }

  return (
    <section className="border-b border-border/60">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center gap-2 border-y border-border bg-surface-raised px-3 py-2 text-left hover:bg-surface-raised"
        aria-expanded={!collapsed}
        aria-controls={`host-section-${id}`}
      >
        <span className="inline-block w-3 shrink-0 text-xs text-accent/80">
          {collapsed ? '▸' : '▾'}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-fg">
          {label}
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-fg-2">{hosts.length}</span>
      </button>
      {!collapsed && (
        <ul id={`host-section-${id}`}>
          {hosts.map((host) => (
            <HostListItem
              key={`${id}:${host.id}`}
              host={host}
              selected={selectedHostId === host.id}
              onSelect={() => onSelect(host.id)}
              onConnect={() => onConnect(host)}
              onEdit={() => onEdit(host.id)}
              onCopy={() => onCopy(host.id)}
              onDelete={() => onDelete(host.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
