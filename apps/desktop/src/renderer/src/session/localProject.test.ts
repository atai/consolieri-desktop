import { describe, expect, it } from 'vitest'
import type { Host, HostSessionPresetPane } from '@shared/types'
import { presetPaneToConnectRequest } from './localProject'

function host(): Host {
  return {
    id: 'h1',
    name: 'project',
    hostname: 'localhost',
    port: 0,
    kind: 'local',
    osType: 'macos',
    tags: [],
    groupId: null,
    notes: '',
    defaultProfileId: 'profile-1',
    uxProfileId: null,
    logVerbosity: 'info',
    relatedHostIds: [],
    gatewayHostId: null,
    httpEndpoint: null,
    homeDir: '/Users/ra/new-home',
    createdAt: '',
    updatedAt: ''
  }
}

function pane(cwd: string | null): HostSessionPresetPane {
  return {
    paneId: 'pane-1',
    title: 'dev',
    protocol: 'local_pty',
    localShell: 'zsh',
    cwd
  }
}

describe('presetPaneToConnectRequest', () => {
  it('keeps the saved pane directory when the host has a home folder', () => {
    expect(presetPaneToConnectRequest(host(), pane('/Users/ra/saved')).cwd).toBe('/Users/ra/saved')
  })

  it('does not fill a missing saved directory from the host home folder', () => {
    expect(presetPaneToConnectRequest(host(), pane(null)).cwd).toBeUndefined()
  })
})
