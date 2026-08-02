import type { SelectHTMLAttributes } from 'react'

export interface LabeledSelectOption {
  value: string
  label: string
}

export interface LabeledSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  options: LabeledSelectOption[]
  emptyOption?: LabeledSelectOption
}

export function LabeledSelect({
  label,
  options,
  emptyOption,
  className = '',
  ...props
}: LabeledSelectProps): React.JSX.Element {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select
        className={`mt-1 w-full rounded-sm border border-border bg-bg px-2 py-1.5 text-fg ${className}`}
        {...props}
      >
        {emptyOption && <option value={emptyOption.value}>{emptyOption.label}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
