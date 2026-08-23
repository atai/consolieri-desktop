import type { Accelerator } from './types'

export type HotkeyPlatform = 'darwin' | 'win32' | 'linux' | 'other'

export interface KeyEventLike {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

export function detectHotkeyPlatform(
  platform: string = typeof process !== 'undefined' ? process.platform : 'other'
): HotkeyPlatform {
  if (platform === 'darwin') return 'darwin'
  if (platform === 'win32') return 'win32'
  if (platform === 'linux') return 'linux'
  return 'other'
}

function normalizeKey(key: string): string {
  if (key === ' ') return 'space'
  if (key.length === 1) return key.toLowerCase()
  return key.toLowerCase()
}

function expectedModKeys(
  accel: Accelerator,
  platform: HotkeyPlatform
): { ctrl: boolean; meta: boolean; alt: boolean; shift: boolean } {
  let ctrl = Boolean(accel.ctrl)
  let meta = Boolean(accel.meta)
  if (accel.mod) {
    if (platform === 'darwin') meta = true
    else ctrl = true
  }
  return {
    ctrl,
    meta,
    alt: Boolean(accel.alt),
    shift: Boolean(accel.shift)
  }
}

export function matchAccelerator(
  event: KeyEventLike,
  accel: Accelerator,
  platform: HotkeyPlatform = detectHotkeyPlatform()
): boolean {
  const expected = expectedModKeys(accel, platform)
  if (event.ctrlKey !== expected.ctrl) return false
  if (event.metaKey !== expected.meta) return false
  if (event.altKey !== expected.alt) return false
  if (event.shiftKey !== expected.shift) return false
  return normalizeKey(event.key) === normalizeKey(accel.key)
}

/** True when the binding collides with terminal copy/paste (Mod+Shift+C/V). */
export function conflictsWithClipboard(accel: Accelerator): boolean {
  const key = normalizeKey(accel.key)
  if (key !== 'c' && key !== 'v') return false
  if (!accel.shift) return false
  return Boolean(accel.mod || accel.ctrl || accel.meta)
}

export function acceleratorFromKeyboardEvent(
  event: KeyEventLike,
  platform: HotkeyPlatform = detectHotkeyPlatform()
): Accelerator | null {
  const key = normalizeKey(event.key)
  if (
    key === 'control' ||
    key === 'meta' ||
    key === 'alt' ||
    key === 'shift' ||
    key === 'os'
  ) {
    return null
  }

  const hasMod = event.ctrlKey || event.metaKey || event.altKey
  if (!hasMod) return null

  const accel: Accelerator = { key }

  if (platform === 'darwin') {
    if (event.metaKey) accel.mod = true
    else if (event.ctrlKey) accel.ctrl = true
  } else {
    if (event.ctrlKey) accel.mod = true
    else if (event.metaKey) accel.meta = true
  }

  if (event.altKey) accel.alt = true
  if (event.shiftKey) accel.shift = true

  return accel
}
