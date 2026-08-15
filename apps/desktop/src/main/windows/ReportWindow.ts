import type { BrowserWindow } from 'electron'
import { reportRepository } from '../reports/ReportRepository'
import { formatReportWindowTitle, pinBrowserWindowTitle } from '../windowTitles'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'
import { getReportWindow, registerReportWindow } from './ReportWindowRegistry'

export function openReportWindow(reportId: string, parent: BrowserWindow | null): BrowserWindow {
  const report = reportRepository.get(reportId)
  const title = formatReportWindowTitle(report?.name ?? 'Report')

  const existing = getReportWindow(reportId)
  if (existing) {
    existing.setTitle(title)
    existing.focus()
    return existing
  }

  const win = createAppBrowserWindow({
    width: 800,
    height: 560,
    minWidth: 480,
    minHeight: 320,
    title,
    parent: parent ?? undefined,
    show: false,
    preload: 'report'
  })
  attachWindowDiagnostics(win, { name: 'report-window' })

  pinBrowserWindowTitle(win, () =>
    formatReportWindowTitle(reportRepository.get(reportId)?.name ?? 'Report')
  )

  registerReportWindow(reportId, win)

  loadRendererEntry(win, 'report-window', { reportId })
  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show()
      win.focus()
    }
  })

  return win
}
