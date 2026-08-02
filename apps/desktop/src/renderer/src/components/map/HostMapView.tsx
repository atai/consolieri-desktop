import { useMemo, useState } from 'react'
import type { MapViewMode } from '@consoleri/core'
import { useAppStore } from '../../stores/appStore'
import { HostMapCanvas } from './HostMapCanvas'

const MODE_OPTIONS: Array<{ value: MapViewMode; label: string }> = [
  { value: 'logical', label: 'Logical' },
  { value: 'network', label: 'Network' }
]

export function HostMapView(): React.JSX.Element {
  const { allHosts, mapMode, setMapMode, refreshAllHosts } = useAppStore()
  const [search, setSearch] = useState('')

  const filteredHosts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allHosts
    return allHosts.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.hostname.toLowerCase().includes(q) ||
        h.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [allHosts, search])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <h1 className="mr-2 text-sm font-semibold text-fg">Network map</h1>
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMapMode(option.value)}
            className={`rounded px-2 py-1 text-xs ${
              mapMode === option.value
                ? 'bg-accent text-accent-on'
                : 'bg-surface-raised text-muted hover:text-fg'
            }`}
          >
            {option.label}
          </button>
        ))}
        <input
          type="search"
          placeholder="Find host…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto min-w-[160px] rounded border border-border bg-bg px-2 py-1 text-xs text-fg placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => void refreshAllHosts()}
          className="rounded border border-border px-2 py-1 text-xs text-muted hover:bg-surface-raised"
        >
          Refresh
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <HostMapCanvas hosts={filteredHosts} />
      </div>
    </div>
  )
}
