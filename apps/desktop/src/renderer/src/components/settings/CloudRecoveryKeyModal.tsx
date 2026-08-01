import { useState } from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { DialogHeader } from '../ui/DialogHeader'
import { DialogFooter } from '../ui/DialogFooter'

export type CloudRecoveryKeyMode = 'export' | 'import'

export interface CloudRecoveryKeyModalProps {
  mode: CloudRecoveryKeyMode
  recoveryKey?: string
  onClose: () => void
  onImported?: () => void
}

export function CloudRecoveryKeyModal({
  mode,
  recoveryKey = '',
  onClose,
  onImported
}: CloudRecoveryKeyModalProps): React.JSX.Element {
  const [acknowledged, setAcknowledged] = useState(false)
  const [importValue, setImportValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    await window.consoleri.clipboard.writeText(recoveryKey)
    setCopied(true)
  }

  const handleImport = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await window.consoleri.cloud.importRecoveryKey(importValue.trim())
      onImported?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'import') {
    return (
      <Modal size="md" onClose={onClose}>
        <DialogHeader
          title="Import recovery key"
          subtitle="Paste the sync key from another device. Without the matching key, cloud backups cannot be decrypted."
          onClose={onClose}
          bordered
        />
        <div className="space-y-3 p-4">
          <textarea
            className="h-28 w-full rounded border border-[#30363d] bg-[#0d1117] px-2 py-1.5 font-mono text-xs text-gray-100"
            value={importValue}
            onChange={(e) => setImportValue(e.target.value)}
            placeholder="Base64 sync key"
            spellCheck={false}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <DialogFooter
          onCancel={onClose}
          onConfirm={() => void handleImport()}
          confirmLabel="Save key"
          loading={busy}
          disabled={!importValue.trim()}
        />
      </Modal>
    )
  }

  return (
    <Modal size="md" onClose={acknowledged ? onClose : undefined}>
      <DialogHeader
        title="Save your recovery key"
        subtitle="This key encrypts your cloud backups. Consolieri cannot recover it. Store it somewhere safe."
        bordered
      />
      <div className="space-y-3 p-4">
        <pre className="overflow-x-auto rounded border border-[#30363d] bg-[#0d1117] p-3 font-mono text-xs text-gray-100 break-all whitespace-pre-wrap">
          {recoveryKey}
        </pre>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => void handleCopy()}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <label className="flex items-start gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>I stored this key somewhere safe. Without it, other devices cannot decrypt cloud backups.</span>
        </label>
      </div>
      <DialogFooter
        onCancel={onClose}
        onConfirm={onClose}
        cancelLabel="Close"
        confirmLabel="Done"
        disabled={!acknowledged}
      />
    </Modal>
  )
}
