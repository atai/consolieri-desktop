import { Component, type ErrorInfo, type ReactNode } from 'react'

interface RendererErrorBoundaryProps {
  children: ReactNode
  title?: string
}

interface RendererErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time crashes so child windows show a recoverable UI
 * instead of a blank chrome background.
 */
export class RendererErrorBoundary extends Component<
  RendererErrorBoundaryProps,
  RendererErrorBoundaryState
> {
  state: RendererErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RendererErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[renderer] Uncaught render error:', error, info.componentStack)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
        <h1 className="text-base font-semibold text-fg">{this.props.title ?? 'Something went wrong'}</h1>
        <p className="max-w-md whitespace-pre-wrap break-words text-sm text-danger">
          {error.message || String(error)}
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded bg-accent px-3 py-1.5 text-xs text-accent-on hover:bg-accent-hover"
        >
          Reload
        </button>
      </div>
    )
  }
}
