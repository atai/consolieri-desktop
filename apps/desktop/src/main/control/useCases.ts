import { parseControlWindowRecipe, recipeHasCommand } from './recipes'
import {
  requestWindowConfirmation,
  shouldSkipConfirmation
} from './confirm'
import { touchControlClient, upsertControlClient } from './clients'
import { appendControlAudit } from './audit'
import {
  closeWorkspaceWindow,
  findWorkspaceWindowByKey,
  focusWorkspaceWindow,
  getWorkspaceWindow,
  listWorkspaceWindows,
  openWorkspaceWindowFromRecipe
} from '../windows/WorkspaceWindow'
import type { ControlWindowInfo, ControlWindowRecipe } from '../../shared/types'

export async function openControlWindow(input: {
  clientName: string
  recipeRaw: unknown
}): Promise<ControlWindowInfo> {
  const recipe = parseControlWindowRecipe(input.recipeRaw)
  upsertControlClient({ name: input.clientName })
  touchControlClient(input.clientName)

  if (recipe.key) {
    const existing = findWorkspaceWindowByKey(recipe.key)
    if (existing) {
      focusWorkspaceWindow(existing.id)
      appendControlAudit({
        client: input.clientName,
        method: 'POST',
        path: '/v1/windows',
        outcome: 'reuse',
        detail: existing.id
      })
      return {
        id: existing.id,
        key: existing.key,
        title: existing.title,
        status: 'open',
        paneCount: existing.panes.length
      }
    }
  }

  const decision = await requestWindowConfirmation({
    clientName: input.clientName,
    recipe
  })
  if (decision === 'denied') {
    appendControlAudit({
      client: input.clientName,
      method: 'POST',
      path: '/v1/windows',
      outcome: 'denied',
      detail: recipe.title
    })
    const err = new Error('User denied the window open request')
    ;(err as Error & { code: string }).code = 'DENIED'
    throw err
  }

  const opened = openWorkspaceWindowFromRecipe(recipe)
  appendControlAudit({
    client: input.clientName,
    method: 'POST',
    path: '/v1/windows',
    outcome: 'opened',
    detail: `${opened.id} panes=${opened.paneCount} hasCommand=${recipeHasCommand(recipe)} skipConfirm=${shouldSkipConfirmation(input.clientName, recipe)}`
  })
  return opened
}

export function listControlWindows(): ControlWindowInfo[] {
  return listWorkspaceWindows()
}

export function getControlWindow(id: string): ControlWindowInfo | null {
  const state = getWorkspaceWindow(id)
  if (!state) return null
  return {
    id: state.id,
    key: state.key,
    title: state.title,
    status: 'open',
    paneCount: state.panes.length
  }
}

export function focusControlWindow(id: string): boolean {
  return focusWorkspaceWindow(id)
}

export function closeControlWindow(id: string): boolean {
  return closeWorkspaceWindow(id)
}

export type { ControlWindowRecipe }
