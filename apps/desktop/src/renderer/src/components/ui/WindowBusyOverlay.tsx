import type { ReactNode } from 'react'

export interface WindowBusyOverlayProps {
  /** Primary status line shown under the spinner */
  title: string
  /** Ordered steps already completed or in progress (newest last) */
  steps?: string[]
  /** Optional action (e.g. View log) */
  action?: ReactNode
  className?: string
}

/**
 * Full-window busy state for child windows: spinner + live steps.
 * Visible as soon as the chrome paints so clicks never look frozen.
 */
export function WindowBusyOverlay({
  title,
  steps = [],
  action,
  className = ''
}: WindowBusyOverlayProps): React.JSX.Element {
  const recent = steps.slice(-8)

  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-3 bg-bg p-6 text-sm text-muted ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
        aria-hidden
      />
      <p className="text-fg-2 animate-pulse">{title}</p>
      {recent.length > 0 && (
        <ul className="mt-1 max-h-40 w-full max-w-md space-y-1 overflow-y-auto font-mono text-xs text-muted">
          {recent.map((step, index) => (
            <li key={`${index}-${step}`} className="truncate">
              {step}
            </li>
          ))}
        </ul>
      )}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
