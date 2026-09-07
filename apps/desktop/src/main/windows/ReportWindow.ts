import type { BrowserWindow } from 'electron'
import { reportRepository } from '../reports/ReportRepository'
import { formatReportWindowTitle, pinBrowserWindowTitle } from '../windowTitles'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'
import { revealWindow } from './revealWindow'
import { getReportWindow, registerReportWindow } from './ReportWindowRegistry'

export function openReportWindow(reportId: string, parent: BrowserWindow | null): BrowserWindow {
  const reportName = reportRepository.getName(reportId) ?? 'Report'
  const title = formatReportWindowTitle(reportName)

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
    formatReportWindowTitle(reportRepository.getName(reportId) ?? 'Report')
  )

  registerReportWindow(reportId, win)

  revealWindow(win)
  loadRendererEntry(win, 'report-window', { reportId })

  return win
}
