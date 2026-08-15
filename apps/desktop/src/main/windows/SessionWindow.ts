import type { BrowserWindow } from 'electron'
import { APP_NAME } from '../appBranding'
import { sessionManager, hostRepository } from '../compositionRoot'
import { formatSessionWindowTitle, joinWindowTitle, pinBrowserWindowTitle } from '../windowTitles'
import {
  registerSessionWindow,
  getRegisteredSessionWindow,
  markAsSessionWindow,
  unregisterAllForWindow
} from './SessionWindowRegistry'
import {
  getHostWindow,
  registerHostWindow,
  unregisterHostWindow
} from './HostWindowRegistry'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'

export { getRegisteredSessionWindow as getSessionWindow }

export function openSessionWindow(sessionId: string): BrowserWindow {
  const existing = getRegisteredSessionWindow(sessionId)
  const info = sessionManager.list().find((s) => s.id === sessionId)
  const title = info ? formatSessionWindowTitle(info) : joinWindowTitle('Session', APP_NAME)

  if (existing) {
    existing.setTitle(title)
    existing.focus()
    return existing
  }

  const win = createSessionBrowserWindow(title)

  pinBrowserWindowTitle(win, () => {
    const session = sessionManager.list().find((s) => s.id === sessionId)
    return session ? formatSessionWindowTitle(session) : joinWindowTitle('Session', APP_NAME)
  })

  registerSessionWindow(sessionId, win)

  win.on('closed', () => {
    sessionManager.closeSessionsForWindow(win)
    unregisterAllForWindow(win)
  })

  loadSessionWindow(win, { sessionId })
  return win
}

export function openHostSessionWindow(hostId: string): BrowserWindow {
  const existing = getHostWindow(hostId)
  if (existing) {
    existing.focus()
    return existing
  }

  const host = hostRepository.getHost(hostId)
  const title = host
    ? joinWindowTitle(host.name, APP_NAME)
    : joinWindowTitle('Local project', APP_NAME)

  const win = createSessionBrowserWindow(title)
  markAsSessionWindow(win)
  registerHostWindow(hostId, win)

  pinBrowserWindowTitle(win, () => {
    const h = hostRepository.getHost(hostId)
    return h ? joinWindowTitle(h.name, APP_NAME) : joinWindowTitle('Local project', APP_NAME)
  })

  win.on('closed', () => {
    unregisterHostWindow(hostId, win)
    sessionManager.closeSessionsForWindow(win)
    unregisterAllForWindow(win)
  })

  loadSessionWindow(win, { hostId })
  return win
}

export function closeSessionWindow(sessionId: string): void {
  const win = getRegisteredSessionWindow(sessionId)
  if (!win) return
  win.removeAllListeners('closed')
  sessionManager.closeSessionsForWindow(win)
  unregisterAllForWindow(win)
  win.close()
}

function createSessionBrowserWindow(title: string): BrowserWindow {
  const win = createAppBrowserWindow({
    width: 960,
    height: 640,
    minWidth: 400,
    minHeight: 300,
    title,
    show: false,
    preload: 'index'
  })
  attachWindowDiagnostics(win, { name: 'session-window' })
  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show()
      win.focus()
    }
  })
  return win
}

function loadSessionWindow(
  win: BrowserWindow,
  query: { sessionId?: string; hostId?: string }
): void {
  const params: Record<string, string> = {}
  if (query.sessionId) params.sessionId = query.sessionId
  if (query.hostId) params.hostId = query.hostId
  loadRendererEntry(win, 'session-window', params)
}
