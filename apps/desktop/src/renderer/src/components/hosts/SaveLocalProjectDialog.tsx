import { useState } from 'react'

export interface SaveLocalProjectDialogProps {
  initialName?: string
  onCancel: () => void
  onSave: (name: string, tags: string[]) => void
  saving?: boolean
}

export function SaveLocalProjectDialog({
  initialName = '',
  onCancel,
  onSave,
  saving = false
}: SaveLocalProjectDialogProps): React.JSX.Element {
  const [name, setName] = useState(initialName)
  const [tags, setTags] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-lg">
        <h2 className="text-sm font-semibold text-fg">Save as local project</h2>
        <p className="mt-1 text-xs text-muted">
          Creates a host in the list that restores this layout and working directories.
        </p>
        <label className="mt-3 block text-xs text-muted">
          Name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-fg"
            placeholder="consoleri"
          />
        </label>
        <label className="mt-2 block text-xs text-muted">
          Tags (comma-separated)
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 w-full rounded border border-border bg-bg px-2 py-1.5 text-sm text-fg"
            placeholder="dev, local"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-border px-3 py-1 text-xs text-muted hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={() =>
              onSave(
                name.trim(),
                tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              )
            }
            className="rounded bg-accent px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
