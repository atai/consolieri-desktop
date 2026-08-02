import { useEffect, useState } from 'react'

export interface RdpCredentials {
  username: string
  password: string
}

const EMPTY_CREDENTIALS: RdpCredentials = { username: '', password: '' }

/**
 * Fetches RDP credentials for the given profile. Returns `null` while the
 * async request is in flight; resolves to empty credentials when no profileId
 * is provided or the profile has no stored credentials.
 */
export function useRdpCredentials(
  effectiveProfileId: string | null | undefined
): RdpCredentials | null {
  const [fetched, setFetched] = useState<RdpCredentials | null>(null)
  const [loadedForId, setLoadedForId] = useState<string | null | undefined>(undefined)

  if (effectiveProfileId !== loadedForId) {
    setLoadedForId(effectiveProfileId)
    setFetched(null)
  }

  useEffect(() => {
    if (!effectiveProfileId) return
    let cancelled = false
    void window.consoleri.sessions.getRdpCredentials(effectiveProfileId).then((creds) => {
      if (!cancelled) {
        setFetched(creds ?? EMPTY_CREDENTIALS)
      }
    })
    return () => {
      cancelled = true
    }
  }, [effectiveProfileId])

  if (!effectiveProfileId) {
    return EMPTY_CREDENTIALS
  }
  return fetched
}
