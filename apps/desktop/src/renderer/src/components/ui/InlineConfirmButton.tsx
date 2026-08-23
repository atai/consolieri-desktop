import { useState, type ReactNode } from 'react'
import { Button, type ButtonSize, type ButtonVariant } from './Button'

export interface InlineConfirmButtonProps {
  label: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: ButtonVariant
  confirmVariant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  className?: string
}

/**
 * Two-step confirm control. Remount via React `key` when the bound entity
 * changes so confirming/busy state resets with identity — do not sync via effects.
 */
export function InlineConfirmButton({
  label,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  confirmVariant = 'danger',
  size = 'sm',
  disabled = false,
  className = ''
}: InlineConfirmButtonProps): React.JSX.Element {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleConfirm = async (): Promise<void> => {
    setBusy(true)
    try {
      await onConfirm()
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  if (confirming) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Button
          variant={confirmVariant}
          size={size}
          disabled={busy || disabled}
          onClick={() => void handleConfirm()}
        >
          {busy ? '…' : confirmLabel}
        </Button>
        <Button variant="ghost" size={size} disabled={busy} onClick={() => setConfirming(false)}>
          {cancelLabel}
        </Button>
      </span>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
      onClick={() => setConfirming(true)}
    >
      {label}
    </Button>
  )
}
