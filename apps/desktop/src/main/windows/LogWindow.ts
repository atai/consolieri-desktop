import type { BrowserWindow } from 'electron'
import { appIconPath } from '../appBranding'
import { sessionManager } from '../sessions/sessionManagerInstance'
import { formatLogWindowTitle, pinBrowserWindowTitle, type LogWindowKind } from '../windowTitles'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'

const logWindows = new Map<string, BrowserWindow>()

export interface LogWindowContext {
  kind?: LogWindowKind
  hostId?: string
  profileId?: string
  fallbackLabel?: string
}

const logContexts = new Map<string, Required<Pick<LogWindowContext, 'kind'>> & LogWindowContext>()

export function registerLogContext(logId: string, context: LogWindowContext): void {
  logContexts.set(logId, {
    kind: context.kind ?? 'connection',
    hostId: context.hostId,
    profileId: context.profileId,
    fallbackLabel: context.fallbackLabel
  })
}

function resolveLogTitle(logId: string, explicit?: LogWindowContext): string {
  const stored = logContexts.get(logId)
  const kind = explicit?.kind ?? stored?.kind ?? 'connection'
  const hostId = explicit?.hostId ?? stored?.hostId
  const profileId = explicit?.profileId ?? stored?.profileId
  const fallbackLabel = explicit?.fallbackLabel ?? stored?.fallbackLabel

  if (hostId || profileId) {
    return formatLogWindowTitle({ kind, hostId, profileId, fallbackLabel })
  }

  const session = sessionManager.list().find((s) => s.id === logId)
  if (session) {
    return formatLogWindowTitle({
      kind: 'connection',
      hostId: session.hostId,
      profileId: session.profileId,
      fallbackLabel: session.title
    })
  }

  return formatLogWindowTitle({ kind, fallbackLabel })
}

export function openLogWindow(
  logId: string,
  parent: BrowserWindow | null,
  context?: LogWindowContext
): BrowserWindow {
  if (context) {
    registerLogContext(logId, context)
  }

  const headerTitle = resolveLogTitle(logId, context)

  const existing = logWindows.get(logId)
  if (existing && !existing.isDestroyed()) {
    existing.setTitle(headerTitle)
    existing.focus()
    return existing
  }

  const win = createAppBrowserWindow({
    width: 640,
    height: 420,
    minWidth: 400,
    minHeight: 200,
    title: headerTitle,
    icon: appIconPath(),
    parent: parent ?? undefined,
    show: false,
    preload: 'log'
  })
  attachWindowDiagnostics(win, { name: 'log-window' })

  pinBrowserWindowTitle(win, () => resolveLogTitle(logId))

  logWindows.set(logId, win)
  sessionManager.setLogWindow(win)

  win.on('closed', () => {
    logWindows.delete(logId)
    sessionManager.setLogWindow(null)
  })

  loadRendererEntry(win, 'log-window', {
    sessionId: logId,
    headerTitle
  })
  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show()
      win.focus()
    }
  })

  return win
}
