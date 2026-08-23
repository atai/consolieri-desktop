import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, FolderOpen } from 'lucide-react'
import type { ConnectionProfile, Host, ScpDirection } from '@shared/types'
import { Modal } from '../ui/Modal'
import { DialogHeader } from '../ui/DialogHeader'
import { DialogFooter } from '../ui/DialogFooter'

interface ScpDialogProps {
  host: Host
  profile: ConnectionProfile
  onClose: () => void
}

function PathField({
  label,
  value,
  onChange,
  onBrowse,
  browseLabel,
  readOnly = false,
  placeholder,
  disabled
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  onBrowse?: () => void
  browseLabel?: string
  readOnly?: boolean
  placeholder?: string
  disabled?: boolean
}): React.JSX.Element {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          className="min-w-0 flex-1 rounded border border-border bg-bg px-2 py-1.5 text-sm text-fg"
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          disabled={disabled}
        />
        {onBrowse && (
          <button
            type="button"
            onClick={onBrowse}
            disabled={disabled}
            className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-surface-raised px-2 py-1.5 text-xs text-fg-2 hover:bg-border disabled:opacity-50"
          >
            <FolderOpen className="h-3.5 w-3.5" aria-hidden />
            {browseLabel ?? 'Browse'}
          </button>
        )}
      </div>
    </label>
  )
}

export function ScpDialog({ host, profile, onClose }: ScpDialogProps): React.JSX.Element {
  const [direction, setDirection] = useState<ScpDirection>('upload')
  const [sourcePath, setSourcePath] = useState('')
  const [destPath, setDestPath] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.consoleri.scp.getRecent(profile.id).then((recent) => {
      if (cancelled || !recent) return
      setDirection(recent.direction)
      setSourcePath(recent.sourcePath)
      setDestPath(recent.destPath)
    })
    return () => {
      cancelled = true
    }
  }, [profile.id])

  const handleDirectionChange = (next: ScpDirection): void => {
    if (next === direction) return
    setDirection(next)
    setSourcePath('')
    setDestPath('')
    setResult(null)
  }

  const handleBrowseSource = async (): Promise<void> => {
    const path = direction === 'upload' ? await window.consoleri.scp.pickFile() : null
    if (path) {
      setSourcePath(path)
      setResult(null)
    }
  }

  const handleBrowseDest = async (): Promise<void> => {
    const path = direction === 'download' ? await window.consoleri.scp.pickDir() : null
    if (path) {
      setDestPath(path)
      setResult(null)
    }
  }

  const canTransfer = sourcePath.trim().length > 0 && destPath.trim().length > 0

  const handleTransfer = async (): Promise<void> => {
    if (!canTransfer) return
    setTransferring(true)
    setResult(null)
    try {
      const res = await window.consoleri.scp.transfer({
        hostId: host.id,
        profileId: profile.id,
        direction,
        sourcePath: sourcePath.trim(),
        destPath: destPath.trim()
      })
      setResult(res)
      if (res.success) {
        await window.consoleri.scp.setRecent(profile.id, {
          direction,
          sourcePath: sourcePath.trim(),
          destPath: destPath.trim()
        })
      }
    } catch (e) {
      setResult({
        success: false,
        message: e instanceof Error ? e.message : String(e)
      })
    } finally {
      setTransferring(false)
    }
  }

  const sourceIsLocal = direction === 'upload'
  const destIsLocal = direction === 'download'

  return (
    <Modal size="lg" onClose={transferring ? undefined : onClose}>
      <DialogHeader
        title="SCP transfer"
        subtitle={
          <>
            {host.name} · {profile.name}
          </>
        }
        onClose={transferring ? undefined : onClose}
        bordered
      />

      <div className="space-y-4 px-4 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleDirectionChange('upload')}
            disabled={transferring}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded border px-3 py-2 text-sm transition-colors ${
              direction === 'upload'
                ? 'border-accent bg-accent/20 text-blue-300'
                : 'border-border bg-bg text-muted hover:bg-surface-raised'
            }`}
          >
            <ArrowUpFromLine className="h-4 w-4" aria-hidden />
            Upload
          </button>
          <button
            type="button"
            onClick={() => handleDirectionChange('download')}
            disabled={transferring}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded border px-3 py-2 text-sm transition-colors ${
              direction === 'download'
                ? 'border-accent bg-accent/20 text-blue-300'
                : 'border-border bg-bg text-muted hover:bg-surface-raised'
            }`}
          >
            <ArrowDownToLine className="h-4 w-4" aria-hidden />
            Download
          </button>
        </div>

        <div className="space-y-3 rounded border border-border bg-bg p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted">Источник</div>
          {sourceIsLocal ? (
            <PathField
              label="Local file"
              value={sourcePath}
              readOnly
              onBrowse={() => void handleBrowseSource()}
              browseLabel="File"
              placeholder="Select a local file"
              disabled={transferring}
            />
          ) : (
            <PathField
              label="Remote file path"
              value={sourcePath}
              onChange={setSourcePath}
              placeholder="/home/user/file.txt"
              disabled={transferring}
            />
          )}
        </div>

        <div className="space-y-3 rounded border border-border bg-bg p-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Назначение
          </div>
          {destIsLocal ? (
            <PathField
              label="Local directory"
              value={destPath}
              readOnly
              onBrowse={() => void handleBrowseDest()}
              browseLabel="Folder"
              placeholder="Select a local directory"
              disabled={transferring}
            />
          ) : (
            <PathField
              label="Remote directory path"
              value={destPath}
              onChange={setDestPath}
              placeholder="/home/user/"
              disabled={transferring}
            />
          )}
        </div>

        {result && (
          <p className={`text-xs ${result.success ? 'text-success' : 'text-danger'}`}>
            {result.message}
          </p>
        )}
      </div>

      <DialogFooter
        onCancel={onClose}
        onConfirm={() => void handleTransfer()}
        confirmLabel="Transfer"
        loading={transferring}
        loadingLabel="Transferring…"
        disabled={!canTransfer}
      />
    </Modal>
  )
}
