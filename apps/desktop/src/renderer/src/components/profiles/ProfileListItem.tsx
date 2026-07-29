import { ArrowRightLeft, Pencil, Play, Trash2 } from 'lucide-react'
import type { ConnectionProfile, Host } from '@shared/types'
import { profileSummaryLines } from './profileDisplay'
import { ConfirmDeleteButton } from '../ui/ConfirmDeleteButton'
import { IconButton } from '../ui/IconButton'

interface ProfileListItemProps {
  profile: ConnectionProfile
  host?: Host
  hosts: Host[]
  linkedHosts?: Host[]
  compact?: boolean
  showLinkedHosts?: boolean
  deleteLabel?: string
  confirmDeleteLabel?: string
  onConnect?: (profileId: string) => void
  onScp?: (profileId: string) => void
  onEdit: () => void
  onDelete: () => void | Promise<void>
  onUnlink?: () => void | Promise<void>
}

export function ProfileListItem({
  profile,
  host,
  hosts,
  linkedHosts = [],
  compact = false,
  showLinkedHosts = !compact,
  confirmDeleteLabel = 'Delete',
  onConnect,
  onScp,
  onEdit,
  onDelete,
  onUnlink
}: ProfileListItemProps): React.JSX.Element {
  const isDefault = host?.defaultProfileId === profile.id
  const summary = profileSummaryLines(profile, hosts)
  const hostLine =
    showLinkedHosts && linkedHosts.length > 0
      ? `hosts: ${linkedHosts.map((h) => h.name).join(', ')}`
      : showLinkedHosts
        ? 'no linked hosts'
        : null

  return (
    <li
      className={`border-b border-[#30363d] ${compact ? 'px-0 py-2' : 'px-3 py-2.5'} last:border-b-0`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium text-gray-200">{profile.name}</span>
            <span className="rounded bg-[#21262d] px-1.5 py-0.5 text-[10px] uppercase text-gray-400">
              {profile.protocol}
            </span>
            {isDefault && (
              <span className="rounded bg-blue-900/50 px-1.5 py-0.5 text-[10px] text-blue-300">
                default
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {[hostLine, ...summary].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onConnect && (
            <IconButton
              variant="primary"
              size="sm"
              icon={Play}
              label="Connect"
              onClick={() => onConnect(profile.id)}
            />
          )}
          {profile.protocol === 'ssh' && onScp && (
            <IconButton
              variant="default"
              size="sm"
              icon={ArrowRightLeft}
              label="SCP"
              onClick={() => onScp(profile.id)}
            />
          )}
          <IconButton variant="default" size="sm" icon={Pencil} label="Edit" onClick={onEdit} />
          <ConfirmDeleteButton
            label={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
            confirmLabel={onUnlink ? 'Remove' : confirmDeleteLabel}
            resetKey={profile.id}
            onConfirm={onUnlink ?? onDelete}
            variant="default"
          />
        </div>
      </div>
    </li>
  )
}
