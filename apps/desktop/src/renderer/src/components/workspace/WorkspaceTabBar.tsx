import { X } from 'lucide-react'
import type { SessionInfo, WorkspaceTab } from '@shared/types'

interface WorkspaceTabBarProps {
  tabs: WorkspaceTab[]
  activeTabId: string | null
  sessions: SessionInfo[]
  onActivate: (tabId: string) => void
  onClose: (tabId: string) => void
}

function tabStatus(tab: WorkspaceTab, sessions: SessionInfo[]): 'connecting' | 'error' | null {
  const sessionIds = new Set(
    tab.panes.map((pane) => pane.sessionId).filter((id): id is string => Boolean(id))
  )
  const owned = sessions.filter((session) => sessionIds.has(session.id))
  if (owned.some((session) => session.status === 'connecting')) return 'connecting'
  if (owned.some((session) => session.status === 'error')) return 'error'
  return null
}

export function WorkspaceTabBar({
  tabs,
  activeTabId,
  sessions,
  onActivate,
  onClose
}: WorkspaceTabBarProps): React.JSX.Element | null {
  if (tabs.length === 0) return null

  return (
    <div
      role="tablist"
      aria-label="Workspace sessions"
      className="flex shrink-0 items-end gap-1 overflow-x-auto border-b border-border bg-surface px-1 pt-1"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeTabId
        const status = tabStatus(tab, sessions)
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            title={tab.title}
            onClick={() => onActivate(tab.id)}
            onAuxClick={(event) => {
              if (event.button !== 1) return
              event.preventDefault()
              onClose(tab.id)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              onActivate(tab.id)
            }}
            className={`flex max-w-56 cursor-pointer items-center gap-1.5 rounded-t border border-b-0 px-2 py-1 text-xs ${
              selected
                ? 'border-border border-t-accent bg-bg text-fg'
                : 'border-transparent text-muted hover:bg-surface-raised hover:text-fg'
            }`}
          >
            {status && (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  status === 'error' ? 'bg-danger' : 'bg-accent'
                }`}
                aria-hidden
              />
            )}
            <span className="min-w-0 flex-1 truncate">{tab.title}</span>
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              title={`Close ${tab.title}`}
              onClick={(event) => {
                event.stopPropagation()
                onClose(tab.id)
              }}
              className="rounded p-0.5 text-muted hover:bg-surface-raised hover:text-fg"
            >
              <X size={12} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
