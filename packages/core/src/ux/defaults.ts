import type { ChromeAppearance, TerminalAppearance, TerminalTheme, UxProfile } from './types'
import { BUILTIN_UX_PROFILE_ID } from './types'

/** Aligned with design-system/hex.json terminal* keys. */
export const DEFAULT_TERMINAL_THEME: TerminalTheme = {
  background: '#0a1018',
  foreground: '#c9d1d9',
  cursor: '#2b7fff',
  selectionBackground: '#264f78',
  black: '#484f58',
  red: '#ef4444',
  green: '#10b981',
  yellow: '#eab308',
  blue: '#2b7fff',
  magenta: '#a78bfa',
  cyan: '#22d3ee',
  white: '#b1bac4',
  brightBlack: '#6e7681',
  brightRed: '#f87171',
  brightGreen: '#34d399',
  brightYellow: '#fbbf24',
  brightBlue: '#60a5fa',
  brightMagenta: '#c4b5fd',
  brightCyan: '#67e8f9',
  brightWhite: '#f1f5f9'
}

export const DEFAULT_TERMINAL_APPEARANCE: TerminalAppearance = {
  fontSize: 13,
  fontFamily: '"JetBrains Mono", "IBM Plex Mono", Consolas, "Cascadia Mono", monospace',
  cursorBlink: true,
  scrollback: 10000,
  theme: DEFAULT_TERMINAL_THEME,
  shellPrompt: 'consoleri'
}

export const MIN_SIDEBAR_WIDTH = 360
export const MAX_SIDEBAR_WIDTH = 480

export const DEFAULT_CHROME_APPEARANCE: ChromeAppearance = {
  sidebarWidth: 360
}

export function createBuiltinUxProfile(now = new Date().toISOString()): UxProfile {
  return {
    id: BUILTIN_UX_PROFILE_ID,
    name: 'Consoleri Dark',
    terminal: DEFAULT_TERMINAL_APPEARANCE,
    chrome: DEFAULT_CHROME_APPEARANCE,
    isBuiltin: true,
    createdAt: now,
    updatedAt: now
  }
}
