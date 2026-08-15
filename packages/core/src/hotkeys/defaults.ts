import type { Accelerator, KeybindingId, Keybindings } from './types'
import { KEYBINDING_IDS } from './types'

export const DEFAULT_KEYBINDINGS: Record<KeybindingId, Accelerator> = {
  toggleMaximizePane: { mod: true, shift: true, key: 'm' }
}

export function mergeKeybindings(partial?: Keybindings | null): Record<KeybindingId, Accelerator> {
  const result = { ...DEFAULT_KEYBINDINGS }
  if (!partial) return result
  for (const id of KEYBINDING_IDS) {
    const value = partial[id]
    if (value && typeof value.key === 'string' && value.key.length > 0) {
      result[id] = {
        key: value.key,
        ...(value.mod ? { mod: true } : {}),
        ...(value.ctrl ? { ctrl: true } : {}),
        ...(value.meta ? { meta: true } : {}),
        ...(value.alt ? { alt: true } : {}),
        ...(value.shift ? { shift: true } : {})
      }
    }
  }
  return result
}
