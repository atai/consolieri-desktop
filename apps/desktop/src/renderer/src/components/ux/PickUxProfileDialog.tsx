import { useEffect, useState } from 'react'
import type { UxProfile } from '@shared/types'
import { DialogHeader } from '../ui/DialogHeader'
import { Modal } from '../ui/Modal'

interface PickUxProfileDialogProps {
  targetHostId: string
  onClose: () => void
  onPick: (profile: UxProfile) => void
}

export function PickUxProfileDialog({
  targetHostId,
  onClose,
  onPick
}: PickUxProfileDialogProps): React.JSX.Element {
  const [profiles, setProfiles] = useState<UxProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void window.consoleri.uxProfiles.list().then((list) => {
      setProfiles(list)
      setLoading(false)
    })
  }, [targetHostId])

  return (
    <Modal size="md" scrollable onClose={onClose}>
      <DialogHeader bordered title="Link appearance profile" onClose={onClose} />
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-center text-sm text-muted">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted">No profiles available</p>
        ) : (
          <ul>
            {profiles.map((profile) => (
              <li key={profile.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => onPick(profile)}
                  className="w-full px-4 py-2.5 text-left hover:bg-surface-raised"
                >
                  <div className="text-sm text-fg">{profile.name}</div>
                  <div className="text-xs text-muted">
                    {profile.terminal.fontSize}px · sidebar {profile.chrome.sidebarWidth}px
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
