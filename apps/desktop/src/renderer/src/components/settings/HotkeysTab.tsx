import { useEffect, useState } from 'react'
import {
  acceleratorFromKeyboardEvent,
  conflictsWithClipboard,
  DEFAULT_KEYBINDINGS,
  formatAccelerator,
  KEYBINDING_IDS,
  KEYBINDING_LABELS,
  mergeKeybindings,
  type Accelerator,
  type KeybindingId
} from '@consoleri/core'
import { usePreferencesStore } from '../../stores/preferencesStore'

function HotkeysTab(): React.JSX.Element {
  const { settings, setKeybinding, resetKeybindings } = usePreferencesStore()
  const keybindings = mergeKeybindings(settings.keybindings)
  const [recordingId, setRecordingId] = useState<KeybindingId | null>(null)
  const [recordError, setRecordError] = useState<string | null>(null)

  useEffect(() => {
    if (!recordingId) return

    const onKeyDown = (event: KeyboardEvent): void => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        setRecordingId(null)
        setRecordError(null)
        return
      }

      const accel = acceleratorFromKeyboardEvent(event)
      if (!accel) {
        setRecordError('Include at least one modifier (Ctrl/Cmd/Alt)')
        return
      }

      void setKeybinding(recordingId, accel).then(() => {
        setRecordingId(null)
        setRecordError(null)
      })
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recordingId, setKeybinding])

  const startRecord = (id: KeybindingId): void => {
    setRecordError(null)
    setRecordingId(id)
  }

  const resetOne = (id: KeybindingId): void => {
    void setKeybinding(id, DEFAULT_KEYBINDINGS[id])
  }

  return (
    <div className="max-w-xl space-y-6 p-6">
      <div>
        <h2 className="mb-1 text-base font-semibold text-fg">Hotkeys</h2>
        <p className="mb-4 text-xs text-muted">
          Shortcuts work when focus is in a console. Double-click a pane title bar to maximize or
          restore without a hotkey.
        </p>

        <div className="space-y-3">
          {KEYBINDING_IDS.map((id) => {
            const accel = keybindings[id] as Accelerator
            const clipboardConflict = conflictsWithClipboard(accel)
            const isRecording = recordingId === id

            return (
              <div
                key={id}
                className="rounded border border-border bg-bg px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-fg">{KEYBINDING_LABELS[id]}</p>
                    <p className="mt-1 font-mono text-xs text-fg-2">
                      {isRecording ? 'Press a key combination…' : formatAccelerator(accel)}
                    </p>
                    {clipboardConflict && !isRecording && (
                      <p className="mt-1 text-xs text-danger">
                        Conflicts with terminal copy/paste (Mod+Shift+C/V)
                      </p>
                    )}
                    {isRecording && recordError && (
                      <p className="mt-1 text-xs text-danger">{recordError}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => (isRecording ? setRecordingId(null) : startRecord(id))}
                      className="rounded border border-border px-2 py-1 text-xs text-fg-2 hover:bg-surface-raised"
                    >
                      {isRecording ? 'Cancel' : 'Record'}
                    </button>
                    <button
                      type="button"
                      onClick={() => resetOne(id)}
                      className="rounded border border-border px-2 py-1 text-xs text-fg-2 hover:bg-surface-raised"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => void resetKeybindings()}
            className="text-xs text-muted underline hover:text-fg"
          >
            Reset all hotkeys to defaults
          </button>
        </div>
      </div>
    </div>
  )
}

export { HotkeysTab }
