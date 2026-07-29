import type { SessionInfo } from '@shared/types'

export async function applySessionStatusUpdate(
  id: string,
  status: SessionInfo['status'],
  error: string | undefined,
  getSessions: () => SessionInfo[],
  upsertSession: (session: SessionInfo) => void
): Promise<void> {
  const existing = getSessions().find((session) => session.id === id)
  if (existing) {
    upsertSession({ ...existing, status, error })
    return
  }

  const listed = await window.consoleri.sessions.list()
  const found = listed.find((session) => session.id === id)
  if (found) {
    upsertSession({ ...found, status, error })
  }
}
