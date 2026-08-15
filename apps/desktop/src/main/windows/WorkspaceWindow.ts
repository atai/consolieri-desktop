import type { BrowserWindow } from 'electron'
import { nanoid } from 'nanoid'
import { insertPaneIntoLayout, type MosaicNode } from '@consoleri/core'
import { APP_NAME } from '../appBranding'
import { sessionManager } from '../compositionRoot'
import { joinWindowTitle, pinBrowserWindowTitle } from '../windowTitles'
import type {
  ControlWindowInfo,
  ControlWindowRecipe,
  OpenSessionRequest,
  PaneBinding,
  SessionInfo
} from '../../shared/types'
import { registerSessionWindow, unregisterAllForWindow } from './SessionWindowRegistry'
import { createAppBrowserWindow } from './createAppBrowserWindow'
import { loadRendererEntry } from './loadRendererEntry'
import { attachWindowDiagnostics } from './attachWindowDiagnostics'

export interface WorkspaceWindowState {
  id: string
  key: string | null
  title: string
  win: BrowserWindow
  layout: MosaicNode<string> | null
  panes: PaneBinding[]
  sessions: SessionInfo[]
}

const byId = new Map<string, WorkspaceWindowState>()
const byKey = new Map<string, string>()

export function listWorkspaceWindows(): ControlWindowInfo[] {
  const result: ControlWindowInfo[] = []
  for (const state of byId.values()) {
    if (state.win.isDestroyed()) continue
    result.push({
      id: state.id,
      key: state.key,
      title: state.title,
      status: 'open',
      paneCount: state.panes.length
    })
  }
  return result
}

export function getWorkspaceWindow(id: string): WorkspaceWindowState | undefined {
  const state = byId.get(id)
  if (!state || state.win.isDestroyed()) {
    if (state) forgetWorkspaceWindow(state)
    return undefined
  }
  return state
}

export function findWorkspaceWindowByKey(key: string): WorkspaceWindowState | undefined {
  const id = byKey.get(key)
  if (!id) return undefined
  return getWorkspaceWindow(id)
}

function forgetWorkspaceWindow(state: WorkspaceWindowState): void {
  byId.delete(state.id)
  if (state.key && byKey.get(state.key) === state.id) byKey.delete(state.key)
}

export function getWorkspaceWindowSnapshot(windowId: string): {
  layout: MosaicNode<string> | null
  panes: PaneBinding[]
  sessions: SessionInfo[]
  title: string
} | null {
  const state = getWorkspaceWindow(windowId)
  if (!state) return null
  return {
    layout: state.layout,
    panes: state.panes,
    sessions: state.sessions,
    title: state.title
  }
}

export function focusWorkspaceWindow(id: string): boolean {
  const state = getWorkspaceWindow(id)
  if (!state) return false
  if (state.win.isMinimized()) state.win.restore()
  state.win.show()
  state.win.focus()
  return true
}

export function closeWorkspaceWindow(id: string): boolean {
  const state = getWorkspaceWindow(id)
  if (!state) return false
  state.win.removeAllListeners('closed')
  sessionManager.closeSessionsForWindow(state.win)
  unregisterAllForWindow(state.win)
  forgetWorkspaceWindow(state)
  state.win.close()
  return true
}

export function openWorkspaceWindowFromRecipe(recipe: ControlWindowRecipe): ControlWindowInfo {
  if (recipe.key) {
    const existing = findWorkspaceWindowByKey(recipe.key)
    if (existing) {
      focusWorkspaceWindow(existing.id)
      return {
        id: existing.id,
        key: existing.key,
        title: existing.title,
        status: 'open',
        paneCount: existing.panes.length
      }
    }
  }

  const windowId = nanoid()
  const title = joinWindowTitle(recipe.title, APP_NAME)
  const win = createAppBrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 500,
    minHeight: 360,
    title,
    show: false,
    preload: 'index'
  })
  attachWindowDiagnostics(win, { name: 'workspace-window' })

  pinBrowserWindowTitle(win, () => title)

  const panes: PaneBinding[] = []
  const sessions: SessionInfo[] = []
  let layout: MosaicNode<string> | null = null

  for (const pane of recipe.panes) {
    const paneId = nanoid()
    const request: OpenSessionRequest = {
      protocol: pane.localShell === 'wsl' ? 'wsl' : 'local_pty',
      title: pane.title,
      localShell: pane.localShell,
      wslDistro: pane.wslDistro,
      cwd: pane.cwd,
      command: pane.command
    }
    const session = sessionManager.open(request)
    registerSessionWindow(session.id, win)
    const binding: PaneBinding = {
      paneId,
      sessionId: session.id,
      protocol: session.protocol,
      title: pane.title,
      connectRequest: request
    }
    panes.push(binding)
    sessions.push(session)
    layout = insertPaneIntoLayout(layout, paneId)
  }

  if (recipe.layout && isValidLayoutForPanes(recipe.layout, panes.map((p) => p.paneId))) {
    layout = recipe.layout as MosaicNode<string>
  }

  const state: WorkspaceWindowState = {
    id: windowId,
    key: recipe.key ?? null,
    title: recipe.title,
    win,
    layout,
    panes,
    sessions
  }
  byId.set(windowId, state)
  if (recipe.key) byKey.set(recipe.key, windowId)

  win.on('closed', () => {
    sessionManager.closeSessionsForWindow(win)
    unregisterAllForWindow(win)
    forgetWorkspaceWindow(state)
  })

  loadRendererEntry(win, 'workspace-window', { windowId })
  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show()
      win.focus()
    }
  })

  return {
    id: windowId,
    key: state.key,
    title: state.title,
    status: 'open',
    paneCount: panes.length
  }
}

function isValidLayoutForPanes(layout: unknown, paneIds: string[]): boolean {
  const ids = new Set(paneIds)
  const seen = new Set<string>()

  function walk(node: unknown): boolean {
    if (typeof node === 'string') {
      if (!ids.has(node) || seen.has(node)) return false
      seen.add(node)
      return true
    }
    if (!node || typeof node !== 'object') return false
    const obj = node as Record<string, unknown>
    if (obj.type === 'split' && Array.isArray(obj.children)) {
      return obj.children.every(walk)
    }
    if (obj.type === 'tabs' && Array.isArray(obj.tabs)) {
      return (obj.tabs as unknown[]).every(walk)
    }
    return false
  }

  if (!walk(layout)) return false
  return seen.size === ids.size
}

/** Test helper */
export function _clearWorkspaceWindowsForTests(): void {
  for (const state of [...byId.values()]) {
    if (!state.win.isDestroyed()) {
      state.win.removeAllListeners('closed')
      state.win.destroy()
    }
  }
  byId.clear()
  byKey.clear()
}
