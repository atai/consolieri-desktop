import type { LucideIcon } from 'lucide-react'
import { Button, type ButtonProps } from './Button'

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon
  label: string
}

export function IconButton({
  icon: Icon,
  label,
  className = '',
  ...props
}: IconButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      title={label}
      aria-label={label}
      className={`!px-1.5 ${className}`}
      {...props}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </Button>
  )
}
