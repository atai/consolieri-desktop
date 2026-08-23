import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { setDatabaseForTest, resetDatabaseForTest } from '../db/database'
import { HostRepository } from './HostRepository'
import { HostSessionPresetRepository } from './HostSessionPresetRepository'

describe('HostSessionPresetRepository', () => {
  let hosts: HostRepository
  let presets: HostSessionPresetRepository

  beforeEach(() => {
    setDatabaseForTest(':memory:')
    hosts = new HostRepository()
    presets = new HostSessionPresetRepository()
  })

  afterEach(() => {
    resetDatabaseForTest()
  })

  it('saves and loads a preset', () => {
    const host = hosts.createHost({
      name: 'consoleri',
      hostname: 'localhost',
      port: 0,
      kind: 'local',
      osType: 'macos'
    })
    const paneId = 'pane-a'
    presets.save(host.id, {
      layout: paneId,
      panes: [
        {
          paneId,
          title: 'dev',
          protocol: 'local_pty',
          localShell: 'zsh',
          cwd: '/Users/ra/git/consoleri'
        }
      ]
    })
    const loaded = presets.get(host.id)
    expect(loaded).not.toBeNull()
    expect(loaded!.panes).toHaveLength(1)
    expect(loaded!.panes[0]!.cwd).toBe('/Users/ra/git/consoleri')
    expect(loaded!.layout).toBe(paneId)
  })

  it('cascades delete with host', () => {
    const host = hosts.createHost({
      name: 'tmp',
      hostname: 'localhost',
      port: 0,
      kind: 'local'
    })
    presets.save(host.id, { layout: 'p1', panes: [{ paneId: 'p1', title: 'a', protocol: 'local_pty' }] })
    hosts.deleteHost(host.id)
    expect(presets.get(host.id)).toBeNull()
  })
})
