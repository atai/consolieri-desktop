import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Host } from '@shared/types'
import { HostListItem } from './HostListItem'

const host: Host = {
  id: 'h1',
  name: 'web-01',
  hostname: '10.0.0.1',
  port: 22,
  kind: 'remote',
  osType: 'linux',
  tags: [],
  groupId: null,
  notes: '',
  defaultProfileId: null,
  uxProfileId: null,
  logVerbosity: 'info',
  relatedHostIds: [],
  gatewayHostId: null,
  httpEndpoint: null,
  homeDir: null,
  createdAt: '',
  updatedAt: ''
}

const noop = vi.fn()

function renderItem(autoFocus?: boolean): void {
  render(
    <HostListItem
      host={host}
      selected={false}
      autoFocus={autoFocus}
      onSelect={noop}
      onConnect={noop}
      onEdit={noop}
      onCopy={noop}
      onDelete={noop}
    />
  )
}

describe('HostListItem focus', () => {
  afterEach(() => cleanup())

  it('focuses the row button when autoFocus is set', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    renderItem(true)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /web-01/ }))
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('does not move focus without autoFocus', () => {
    const before = document.activeElement
    renderItem(false)
    expect(document.activeElement).toBe(before)
  })
})
