import { InlineConfirmButton, type InlineConfirmButtonProps } from './InlineConfirmButton'
import type { ButtonVariant } from './Button'
import type { ReactNode } from 'react'

export type ConfirmDeleteButtonProps = Omit<
  InlineConfirmButtonProps,
  'label' | 'confirmLabel' | 'confirmVariant'
> & {
  label?: ReactNode
  confirmLabel?: string
  variant?: ButtonVariant
}

export function ConfirmDeleteButton({
  label = 'Delete',
  confirmLabel = 'Delete',
  cancelLabel,
  variant = 'ghost',
  ...props
}: ConfirmDeleteButtonProps): React.JSX.Element {
  return (
    <InlineConfirmButton
      label={label}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={variant}
      confirmVariant="danger"
      {...props}
    />
  )
}
