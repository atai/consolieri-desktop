import type { Accelerator } from './types'
import { detectHotkeyPlatform, type HotkeyPlatform } from './match'

function displayKey(key: string): string {
  if (key === ' ') return 'Space'
  if (key.length === 1) return key.toUpperCase()
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/** Human-readable accelerator for UI (mac uses symbols, others use Ctrl/Alt/Shift). */
export function formatAccelerator(
  accel: Accelerator,
  platform: HotkeyPlatform = detectHotkeyPlatform()
): string {
  const parts: string[] = []
  const isMac = platform === 'darwin'

  if (accel.mod) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (accel.ctrl && !accel.mod) {
    parts.push(isMac ? '⌃' : 'Ctrl')
  }
  if (accel.meta && !accel.mod) {
    parts.push(isMac ? '⌘' : 'Meta')
  }
  if (accel.alt) {
    parts.push(isMac ? '⌥' : 'Alt')
  }
  if (accel.shift) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  parts.push(displayKey(accel.key))

  return isMac ? parts.join('') : parts.join('+')
}
