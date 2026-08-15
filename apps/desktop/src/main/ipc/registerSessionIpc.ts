import { BrowserWindow, ipcMain } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '../../shared/types'
import type { WorkspaceState } from '../../shared/types'
import {
  Id,
  LogLevelSchema,
  SessionSnapshotSchema,
  WorkspaceStateSchema,
  OpenSessionRequestSchema
} from '../../shared/ipcSchemas'
import { createHandler } from './createHandler'
import { sessionManager } from '../sessions/sessionManagerInstance'
import { workspaceRepository } from '../hosts/WorkspaceRepository'
import { listWslDistros } from '../sessions/shellUtils'
import { openLogWindow } from '../windows/LogWindow'
import { openHostSessionWindow, openSessionWindow } from '../windows/SessionWindow'
import {
  isRegisteredSessionWindow,
  markAsSessionWindow,
  registerSessionWindow
} from '../windows/SessionWindowRegistry'
import { deletePaneShellHistory, ensureShellHistoryFile } from '../sessions/shellHistory'

export function registerSessionIpc(getWindow: () => BrowserWindow | null): void {
  // ── sessions ───────────────────────────────────────────────────────────────

  ipcMain.handle(
    IPC_CHANNELS.sessionsOpen,
    async (event, rawRequest: unknown, cols?: number, rows?: number) => {
      const request = OpenSessionRequestSchema.parse(rawRequest)
      const win = getWindow()
      if (win) sessionManager.setWindow(win)

      const enriched = { ...request }
      if (request.hostId && request.paneId && !request.histFile) {
        enriched.histFile = ensureShellHistoryFile(request.hostId, request.paneId)
      }

      const session = sessionManager.open(enriched, cols, rows)

      const senderWindow = BrowserWindow.fromWebContents(event.sender)
      const mainWindow = getWindow()
      if (
        senderWindow &&
        (isRegisteredSessionWindow(senderWindow) || (mainWindow && senderWindow !== mainWindow))
      ) {
        registerSessionWindow(session.id, senderWindow)
        markAsSessionWindow(senderWindow)
      }

      return session
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsClose,
    createHandler(Id, (sessionId: string) => {
      sessionManager.close(sessionId)
      return Promise.resolve()
    })
  )

  ipcMain.on(IPC_CHANNELS.sessionsWrite, (_e, sessionId: string, data: string) => {
    sessionManager.write(sessionId, data)
  })

  ipcMain.on(IPC_CHANNELS.sessionsResize, (_e, sessionId: string, cols: number, rows: number) => {
    sessionManager.resize(sessionId, cols, rows)
  })

  ipcMain.handle(IPC_CHANNELS.sessionsList, () => sessionManager.list())

  ipcMain.handle(IPC_CHANNELS.sessionsReconnect, async (event, rawSessionId: unknown) => {
    const sessionId = Id.parse(rawSessionId)
    const session = await sessionManager.reconnect(sessionId)

    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    if (session && senderWindow && isRegisteredSessionWindow(senderWindow)) {
      registerSessionWindow(session.id, senderWindow)
    }

    return session
  })

  ipcMain.handle(
    IPC_CHANNELS.sessionsGetConnectRequest,
    createHandler(Id, (sessionId: string) =>
      Promise.resolve(sessionManager.getConnectRequest(sessionId))
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsGetCwd,
    createHandler(Id, (sessionId: string) => sessionManager.getCwd(sessionId))
  )

  // Credential retrieval is restricted to non-empty profileId (no arbitrary lookup)
  ipcMain.handle(
    IPC_CHANNELS.sessionsRdpCredentials,
    createHandler(Id, (profileId: string) => sessionManager.getCredentialsForRdp(profileId))
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsVncPassword,
    createHandler(Id, (profileId: string) => sessionManager.getCredentialsForVnc(profileId))
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsSnapshot,
    createHandler(SessionSnapshotSchema, (snapshot) => {
      workspaceRepository.saveSessionSnapshot(snapshot)
      return Promise.resolve()
    })
  )

  // ── session logs ───────────────────────────────────────────────────────────

  ipcMain.handle(
    IPC_CHANNELS.sessionsLogGet,
    createHandler(Id, (sessionId: string) =>
      Promise.resolve(sessionManager.getLogEntries(sessionId))
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsLogAppend,
    createHandler(
      z.tuple([Id, LogLevelSchema, z.string()]),
      ([sessionId, level, message]: [string, 'debug' | 'info' | 'warn' | 'error', string]) => {
        sessionManager.appendSessionLog(sessionId, level, message)
        return Promise.resolve()
      }
    )
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsLogOpenWindow,
    createHandler(Id, (sessionId: string) => {
      openLogWindow(sessionId, getWindow())
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsOpenSessionWindow,
    createHandler(Id, (sessionId: string) => {
      openSessionWindow(sessionId)
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.sessionsOpenHostWindow,
    createHandler(Id, (hostId: string) => {
      openHostSessionWindow(hostId)
      return Promise.resolve()
    })
  )

  ipcMain.handle(
    IPC_CHANNELS.shellHistoryDeletePane,
    createHandler(z.tuple([Id, Id]), ([hostId, paneId]: [string, string]) => {
      deletePaneShellHistory(hostId, paneId)
      return Promise.resolve()
    })
  )

  // ── wsl ────────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.wslList, () => listWslDistros())

  // ── workspace ──────────────────────────────────────────────────────────────

  ipcMain.handle(IPC_CHANNELS.workspaceSave, async (_e, rawState: unknown, name?: string) => {
    const state = WorkspaceStateSchema.parse(rawState) as WorkspaceState
    return workspaceRepository.saveWorkspace(state, name)
  })

  ipcMain.handle(IPC_CHANNELS.workspaceLoad, () => workspaceRepository.loadWorkspace())

  ipcMain.handle(IPC_CHANNELS.workspaceGetActive, () => workspaceRepository.getActiveWorkspace())
}
