import type { BrowserWindow } from 'electron'

const reportWindows = new Map<string, BrowserWindow>()

export function registerReportWindow(reportId: string, win: BrowserWindow): void {
  reportWindows.set(reportId, win)
  win.on('closed', () => {
    if (reportWindows.get(reportId) === win) {
      reportWindows.delete(reportId)
    }
  })
}

export function getReportWindow(reportId: string): BrowserWindow | undefined {
  const win = reportWindows.get(reportId)
  if (!win || win.isDestroyed()) {
    reportWindows.delete(reportId)
    return undefined
  }
  return win
}

export function unregisterReportWindow(reportId: string): void {
  reportWindows.delete(reportId)
}

/** Test helper */
export function _clearReportWindowsForTests(): void {
  reportWindows.clear()
}
