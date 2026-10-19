import { describe, expect, it } from 'vitest'
import { migrateWorkspaceState } from './migrate'

describe('migrateWorkspaceState', () => {
  it('turns an empty or unreadable value into no tabs', () => {
    const createId = (): string => 'should-not-run'
    expect(migrateWorkspaceState(null, createId)).toEqual({ tabs: [], activeTabId: null })
    expect(migrateWorkspaceState('null', createId)).toEqual({ tabs: [], activeTabId: null })
    expect(migrateWorkspaceState({ layout: null, panes: [] }, createId)).toEqual({
      tabs: [],
      activeTabId: null
    })
  })

  it('turns a saved single mosaic into one tab', () => {
    const state = migrateWorkspaceState(
      {
        layout: 'pane-1',
        panes: [
          {
            paneId: 'pane-1',
            title: 'web01',
            connectRequest: { hostId: 'h1', title: 'web01' }
          }
        ]
      },
      () => 'tab-1'
    )

    expect(state.activeTabId).toBe('tab-1')
    expect(state.tabs).toEqual([
      {
        id: 'tab-1',
        hostId: 'h1',
        title: 'web01',
        layout: 'pane-1',
        panes: [
          {
            paneId: 'pane-1',
            title: 'web01',
            connectRequest: { hostId: 'h1', title: 'web01' }
          }
        ]
      }
    ])
  })

  it('leaves a tab document in place and drops an unknown active tab', () => {
    const state = migrateWorkspaceState(
      {
        tabs: [
          { id: 'a', hostId: 'h1', title: 'one', layout: 'p', panes: [] },
          { id: 'b', hostId: null, title: 'Local', layout: null, panes: [] }
        ],
        activeTabId: 'missing'
      },
      () => 'unused'
    )

    expect(state.tabs.map((tab) => tab.id)).toEqual(['a', 'b'])
    expect(state.activeTabId).toBe('a')
  })
})
