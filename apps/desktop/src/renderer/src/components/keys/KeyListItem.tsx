import type { SshKeyInfo } from '@shared/types'

interface KeyListItemProps {
  keyInfo: SshKeyInfo
  onAssign: (key: SshKeyInfo) => void
  onDeploy: (key: SshKeyInfo) => void
  onRemove?: (key: SshKeyInfo) => void
  onSetPassphrase?: (key: SshKeyInfo) => void
}

export function KeyListItem({
  keyInfo,
  onAssign,
  onDeploy,
  onRemove,
  onSetPassphrase
}: KeyListItemProps): React.JSX.Element {
  return (
    <li className="border-b border-border p-3 text-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-fg">{keyInfo.label}</div>
          <div className="truncate text-xs text-muted" title={keyInfo.privateKeyPath}>
            {keyInfo.privateKeyPath}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {keyInfo.encrypted && (
            <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] text-amber-300">
              encrypted
            </span>
          )}
          {!keyInfo.exists && (
            <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] text-danger">
              missing
            </span>
          )}
        </div>
      </div>

      {(keyInfo.keyType || keyInfo.fingerprint) && (
        <div className="mb-2 text-xs text-muted">
          {keyInfo.keyType && (
            <span className="mr-2 uppercase">{keyInfo.keyType.replace('ssh-', '')}</span>
          )}
          {keyInfo.fingerprint && (
            <span className="font-mono" title={keyInfo.fingerprint}>
              {keyInfo.fingerprint.slice(0, 20)}…
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onAssign(keyInfo)}
          className="rounded border border-border px-2 py-0.5 text-xs text-fg-2 hover:bg-surface-raised"
        >
          Assign host
        </button>
        <button
          type="button"
          onClick={() => onDeploy(keyInfo)}
          disabled={!keyInfo.publicKeyPath || !keyInfo.exists}
          className="rounded border border-border px-2 py-0.5 text-xs text-fg-2 hover:bg-surface-raised disabled:opacity-40"
        >
          Deploy
        </button>
        {keyInfo.encrypted && onSetPassphrase && (
          <button
            type="button"
            onClick={() => onSetPassphrase(keyInfo)}
            className="rounded border border-border px-2 py-0.5 text-xs text-fg-2 hover:bg-surface-raised"
          >
            Passphrase
          </button>
        )}
        {keyInfo.source === 'custom' && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(keyInfo)}
            className="rounded border border-red-900/50 px-2 py-0.5 text-xs text-danger hover:bg-red-900/20"
          >
            Remove
          </button>
        )}
      </div>
    </li>
  )
}
