import { isAbsolute, normalize, resolve } from 'node:path'
import { z } from 'zod'
import type { ControlWindowRecipe } from '../../shared/types'

export const MAX_CONTROL_PANES = 16

const LocalShellSchema = z.enum(['powershell', 'pwsh', 'cmd', 'bash', 'zsh', 'sh', 'wsl'])

export const ControlWindowPaneSchema = z.object({
  title: z.string().min(1).max(200),
  localShell: LocalShellSchema.optional(),
  wslDistro: z.string().min(1).max(200).optional(),
  cwd: z.string().min(1).max(4096),
  command: z.string().max(4096).optional()
})

export const ControlWindowRecipeSchema = z.object({
  key: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(200),
  layout: z.unknown().optional(),
  panes: z.array(ControlWindowPaneSchema).min(1).max(MAX_CONTROL_PANES)
})

export class RecipeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecipeValidationError'
  }
}

export function assertSafeCwd(cwd: string): string {
  if (!isAbsolute(cwd)) {
    throw new RecipeValidationError(`cwd must be an absolute path: ${cwd}`)
  }
  const normalized = normalize(cwd)
  if (normalized.includes('..')) {
    throw new RecipeValidationError(`cwd must not contain '..': ${cwd}`)
  }
  // Resolve to canonical form without requiring the path to exist yet
  return resolve(normalized)
}

export function parseControlWindowRecipe(raw: unknown): ControlWindowRecipe {
  const parsed = ControlWindowRecipeSchema.parse(raw)

  // Reject any attempt to sneak host/profile fields through layout or extra keys
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const forbidden of ['hostId', 'profileId', 'password', 'privateKey', 'credentialRef']) {
      if (forbidden in obj) {
        throw new RecipeValidationError(`${forbidden} is not allowed in control recipes`)
      }
      for (const pane of Array.isArray(obj.panes) ? obj.panes : []) {
        if (pane && typeof pane === 'object' && forbidden in (pane as object)) {
          throw new RecipeValidationError(`${forbidden} is not allowed on panes`)
        }
      }
    }
  }

  return {
    key: parsed.key,
    title: parsed.title,
    layout: parsed.layout,
    panes: parsed.panes.map((pane) => ({
      ...pane,
      cwd: assertSafeCwd(pane.cwd),
      command: pane.command?.trim() ? pane.command.trim() : undefined
    }))
  }
}

export function recipeHasCommand(recipe: ControlWindowRecipe): boolean {
  return recipe.panes.some((p) => Boolean(p.command?.trim()))
}
