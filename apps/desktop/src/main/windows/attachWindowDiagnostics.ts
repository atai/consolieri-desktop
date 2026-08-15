import type { BrowserWindow } from 'electron'

export interface WindowDiagnosticsOptions {
  /** Short label for logs, e.g. "session-window" */
  name: string
  /** When true, close the window after a hard load failure. Default true for child windows. */
  closeOnFailLoad?: boolean
  onFailLoad?: (details: {
    errorCode: number
    errorDescription: string
    validatedURL: string
  }) => void
}

/**
 * Attach load/process diagnostics so child windows don't fail silently.
 */
export function attachWindowDiagnostics(
  win: BrowserWindow,
  options: WindowDiagnosticsOptions
): void {
  const label = options.name
  const closeOnFailLoad = options.closeOnFailLoad !== false

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return
    // Ignore aborted navigations (e.g. window closed mid-load).
    if (errorCode === -3) return
    console.error(
      `[${label}] Failed to load (${errorCode}): ${errorDescription} (${validatedURL})`
    )
    options.onFailLoad?.({ errorCode, errorDescription, validatedURL })
    if (closeOnFailLoad && !win.isDestroyed()) {
      win.close()
    }
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[${label}] Render process gone:`, details.reason, details.exitCode)
  })

  win.on('unresponsive', () => {
    console.error(`[${label}] Window became unresponsive`)
  })

  win.webContents.on('console-message', (event) => {
    const { level, message, lineNumber, sourceId } = event
    if (level === 'debug' || level === 'info') return
    const prefix = level === 'error' ? 'error' : 'warn'
    console[prefix](`[${label}:renderer] ${message} (${sourceId}:${lineNumber})`)
  })
}
