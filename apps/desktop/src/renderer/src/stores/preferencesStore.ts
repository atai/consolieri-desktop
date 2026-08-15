import { create } from 'zustand'
import {
  mergeKeybindings,
  type Accelerator,
  type AppSettings,
  type KeybindingId,
  type SessionOpenMode
} from '@consoleri/core'

export type { SessionOpenMode }

const LEGACY_SETTINGS_KEY = 'consoleri.settings'

const DEFAULT_SETTINGS: AppSettings = {
  autoOpenConnectionLog: false,
  sessionOpenMode: 'workspace',
  keybindings: mergeKeybindings(),
  externalControl: { enabled: false }
}

interface PreferencesState {
  settings: AppSettings
  loaded: boolean
  refresh: () => Promise<void>
  setAutoOpenConnectionLog: (value: boolean) => Promise<void>
  setSessionOpenMode: (mode: SessionOpenMode) => Promise<void>
  setKeybinding: (id: KeybindingId, accelerator: Accelerator) => Promise<void>
  resetKeybindings: () => Promise<void>
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  settings: { ...DEFAULT_SETTINGS, keybindings: mergeKeybindings() },
  loaded: false,

  refresh: async () => {
    // One-time migration: if the old localStorage key exists, push its values
    // to the DB and remove the key so this branch never runs again.
    try {
      const legacy = localStorage.getItem(LEGACY_SETTINGS_KEY)
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<AppSettings>
        await window.consoleri.preferences.setAppSettings(parsed)
        localStorage.removeItem(LEGACY_SETTINGS_KEY)
      }
    } catch {
      /* ignore migration errors */
    }

    const settings = await window.consoleri.preferences.getAppSettings()
    set({
      settings: {
        ...settings,
        keybindings: mergeKeybindings(settings.keybindings)
      },
      loaded: true
    })
  },

  setAutoOpenConnectionLog: async (autoOpenConnectionLog) => {
    const settings = await window.consoleri.preferences.setAppSettings({ autoOpenConnectionLog })
    set({ settings: { ...settings, keybindings: mergeKeybindings(settings.keybindings) } })
  },

  setSessionOpenMode: async (sessionOpenMode) => {
    const settings = await window.consoleri.preferences.setAppSettings({ sessionOpenMode })
    set({ settings: { ...settings, keybindings: mergeKeybindings(settings.keybindings) } })
  },

  setKeybinding: async (id, accelerator) => {
    const current = usePreferencesStore.getState().settings.keybindings
    const settings = await window.consoleri.preferences.setAppSettings({
      keybindings: { ...current, [id]: accelerator }
    })
    set({ settings: { ...settings, keybindings: mergeKeybindings(settings.keybindings) } })
  },

  resetKeybindings: async () => {
    const settings = await window.consoleri.preferences.setAppSettings({
      keybindings: mergeKeybindings()
    })
    set({ settings: { ...settings, keybindings: mergeKeybindings(settings.keybindings) } })
  }
}))
