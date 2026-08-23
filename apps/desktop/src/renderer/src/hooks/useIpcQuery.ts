import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

export interface UseIpcQueryResult<T> {
  data: T
  loading: boolean
  refresh: () => Promise<void>
  setData: Dispatch<SetStateAction<T>>
}

/**
 * Load async IPC/resource data keyed by `cacheKey`.
 * Effects never call setState synchronously — only after the promise settles.
 * `refresh()` is for user actions and may toggle loading immediately.
 */
export function useIpcQuery<T>(
  fetcher: () => Promise<T>,
  cacheKey: string | number,
  initialData: T
): UseIpcQueryResult<T> {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let cancelled = false
    void fetcherRef.current().then(
      (result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      },
      () => {
        if (!cancelled) setLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
  }, [cacheKey])

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await fetcherRef.current()
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, refresh, setData }
}
