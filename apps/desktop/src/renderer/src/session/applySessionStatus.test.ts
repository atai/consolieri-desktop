import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionInfo } from '@shared/types'
import { applySessionStatusUpdate } from './applySessionStatus'

const mockSessionsList = vi.fn()

const baseSession: SessionInfo = {
  id: 'sess-1',
  protocol: 'ssh',
  title: 'web01',
  status: 'connecting',
  hostId: null,
  profileId: null
}

describe('applySessionStatusUpdate', () => {
  beforeEach(() => {
    mockSessionsList.mockReset()
    Object.defineProperty(window, 'consoleri', {
      value: {
        sessions: {
          list: mockSessionsList
        }
      },
      writable: true,
      configurable: true
    })
  })

  it('patches an existing session in local state', async () => {
    const upsert = vi.fn()
    const getSessions = () => [baseSession]

    await applySessionStatusUpdate('sess-1', 'connected', undefined, getSessions, upsert)

    expect(upsert).toHaveBeenCalledWith({ ...baseSession, status: 'connected', error: undefined })
    expect(mockSessionsList).not.toHaveBeenCalled()
  })

  it('fetches from sessions.list when the session is missing locally', async () => {
    const upsert = vi.fn()
    const getSessions = () => [] as SessionInfo[]
    vi.mocked(mockSessionsList).mockResolvedValue([baseSession])

    await applySessionStatusUpdate('sess-1', 'connected', undefined, getSessions, upsert)

    expect(mockSessionsList).toHaveBeenCalled()
    expect(upsert).toHaveBeenCalledWith({ ...baseSession, status: 'connected', error: undefined })
  })
})
