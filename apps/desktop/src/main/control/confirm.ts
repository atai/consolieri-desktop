import { BrowserWindow, ipcMain } from 'electron'
import { nanoid } from 'nanoid'
import { IPC_CHANNELS } from '../../shared/types'
import type {
  ControlConfirmDecision,
  ControlConfirmRequest,
  ControlWindowRecipe
} from '../../shared/types'
import { recipeHasCommand } from './recipes'
import { isClientAlwaysAllow, markClientAlwaysAllow } from './clients'

const CONFIRM_TIMEOUT_MS = 60_000

interface PendingConfirm {
  resolve: (decision: ControlConfirmDecision) => void
  timer: ReturnType<typeof setTimeout>
}

const pending = new Map<string, PendingConfirm>()
let getMainWindow: (() => BrowserWindow | null) | null = null
let ipcRegistered = false

export function setControlConfirmWindowGetter(getter: () => BrowserWindow | null): void {
  getMainWindow = getter
}

export function registerControlConfirmIpc(): void {
  if (ipcRegistered) return
  ipcRegistered = true

  ipcMain.handle(
    IPC_CHANNELS.controlConfirmResponse,
    (_e, requestId: unknown, decision: unknown) => {
      if (typeof requestId !== 'string') return
      if (
        decision !== 'allow_once' &&
        decision !== 'always_allow' &&
        decision !== 'deny'
      ) {
        return
      }
      settleConfirm(requestId, decision)
    }
  )
}

function settleConfirm(requestId: string, decision: ControlConfirmDecision): void {
  const entry = pending.get(requestId)
  if (!entry) return
  clearTimeout(entry.timer)
  pending.delete(requestId)
  entry.resolve(decision)
}

/**
 * Returns true if the recipe may proceed without showing a dialog.
 */
export function shouldSkipConfirmation(
  clientName: string,
  recipe: ControlWindowRecipe
): boolean {
  if (recipeHasCommand(recipe)) return false
  return isClientAlwaysAllow(clientName)
}

export async function requestWindowConfirmation(input: {
  clientName: string
  recipe: ControlWindowRecipe
}): Promise<'allowed' | 'denied'> {
  if (shouldSkipConfirmation(input.clientName, input.recipe)) {
    return 'allowed'
  }

  const win = getMainWindow?.() ?? null
  if (!win || win.isDestroyed()) {
    return 'denied'
  }

  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()

  const requestId = nanoid()
  const payload: ControlConfirmRequest = {
    requestId,
    clientName: input.clientName,
    title: input.recipe.title,
    hasCommand: recipeHasCommand(input.recipe),
    panes: input.recipe.panes.map((p) => ({
      title: p.title,
      localShell: p.localShell,
      cwd: p.cwd,
      command: p.command
    }))
  }

  const decision = await new Promise<ControlConfirmDecision>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(requestId)
      resolve('deny')
    }, CONFIRM_TIMEOUT_MS)
    pending.set(requestId, { resolve, timer })
    win.webContents.send(IPC_CHANNELS.controlConfirmRequest, payload)
  })

  if (decision === 'deny') return 'denied'
  if (decision === 'always_allow' && !recipeHasCommand(input.recipe)) {
    markClientAlwaysAllow(input.clientName)
  }
  return 'allowed'
}

/** Test helper */
export function _resetControlConfirmForTests(): void {
  for (const entry of pending.values()) clearTimeout(entry.timer)
  pending.clear()
}
