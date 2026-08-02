import type { Host, UxProfile } from '@shared/types'
import { ConfirmDeleteButton } from '../ui/ConfirmDeleteButton'
import { Button } from '../ui/Button'

interface UxProfileListItemProps {
  profile: UxProfile
  host?: Host
  linkedHosts?: Host[]
  isActive: boolean
  onSetActive?: () => void
  onEdit: () => void
  onDelete: () => void | Promise<void>
  onUnlink?: () => void | Promise<void>
}

export function UxProfileListItem({
  profile,
  host,
  linkedHosts = [],
  isActive,
  onSetActive,
  onEdit,
  onDelete,
  onUnlink
}: UxProfileListItemProps): React.JSX.Element {
  const hostLine =
    linkedHosts.length > 0
      ? `hosts: ${linkedHosts.map((h) => h.name).join(', ')}`
      : host
        ? `host: ${host.name}`
        : 'no linked hosts'

  return (
    <li className="border-b border-border px-3 py-2.5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium text-fg">{profile.name}</span>
            {profile.isBuiltin && (
              <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] uppercase text-muted">
                builtin
              </span>
            )}
            {isActive && (
              <span className="rounded bg-accent-muted px-1.5 py-0.5 text-[10px] text-accent">
                active
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {hostLine} · {profile.terminal.fontSize}px · scrollback {profile.terminal.scrollback} ·
            prompt {profile.terminal.shellPrompt === 'server' ? 'server' : 'Consoleri'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onSetActive && !isActive && (
            <Button variant="default" size="sm" onClick={onSetActive}>
              Set active
            </Button>
          )}
          <Button variant="default" size="sm" onClick={onEdit}>
            Edit
          </Button>
          {(onUnlink || !profile.isBuiltin) && (
            <ConfirmDeleteButton
              label={onUnlink ? 'Unlink' : 'Delete'}
              confirmLabel={onUnlink ? 'Unlink' : 'Delete'}
              resetKey={profile.id}
              onConfirm={onUnlink ?? onDelete}
              variant="default"
            />
          )}
        </div>
      </div>
    </li>
  )
}
