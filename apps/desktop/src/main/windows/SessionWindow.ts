import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { APP_NAME, appIconPath } from '../appBranding'
import { sessionManager } from '../sessions/SessionManager'
import { hostRepository } from '../hosts/HostRepository'
import { formatSessionWindowTitle, joinWindowTitle, pinBrowserWindowTitle } from '../windowTitles'
import { CHROME_BG_HEX } from '../../shared/chromeHex'
import {
  registerSessionWindow,
  getRegisteredSessionWindow,
  markAsSessionWindow,
  unregisterAllForWindow
} from './SessionWindowRegistry'

export { getRegisteredSessionWindow as getSessionWindow }

const hostWindows = new Map<string, BrowserWindow>()

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
  const existing = hostWindows.get(hostId)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return existing
  }

  const host = hostRepository.getHost(hostId)
  const title = host
    ? joinWindowTitle(host.name, APP_NAME)
    : joinWindowTitle('Local project', APP_NAME)

  const win = createSessionBrowserWindow(title)
  markAsSessionWindow(win)
  hostWindows.set(hostId, win)

  pinBrowserWindowTitle(win, () => {
    const h = hostRepository.getHost(hostId)
    return h ? joinWindowTitle(h.name, APP_NAME) : joinWindowTitle('Local project', APP_NAME)
  })

  win.on('closed', () => {
    if (hostWindows.get(hostId) === win) hostWindows.delete(hostId)
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
  return new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 400,
    minHeight: 300,
    title,
    icon: appIconPath(),
    backgroundColor: CHROME_BG_HEX,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
}

function loadSessionWindow(
  win: BrowserWindow,
  query: { sessionId?: string; hostId?: string }
): void {
  const params = new URLSearchParams()
  if (query.sessionId) params.set('sessionId', query.sessionId)
  if (query.hostId) params.set('hostId', query.hostId)
  const qs = `?${params.toString()}`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/session-window/index.html${qs}`)
  } else {
    const fileQuery: Record<string, string> = {}
    if (query.sessionId) fileQuery.sessionId = query.sessionId
    if (query.hostId) fileQuery.hostId = query.hostId
    win.loadFile(join(__dirname, '../renderer/session-window/index.html'), {
      query: fileQuery
    })
  }
}
