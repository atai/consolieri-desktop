import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const variantClass: Record<ButtonVariant, string> = {
  default: 'border border-border bg-surface-raised text-fg-2 hover:bg-border hover:text-fg',
  primary: 'bg-accent text-accent-on hover:bg-accent-hover',
  danger: 'bg-danger/20 text-danger hover:bg-danger/30',
  ghost: 'text-muted hover:bg-surface-raised hover:text-fg'
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'rounded-sm px-2 py-1 text-xs',
  md: 'rounded-sm px-3 py-1.5 text-sm'
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'default',
  size = 'sm',
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
