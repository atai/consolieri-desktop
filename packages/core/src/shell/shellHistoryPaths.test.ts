import { describe, expect, it } from 'vitest'
import { shellHistoryDir, shellHistoryFile } from './shellHistoryPaths'

describe('shellHistoryPaths', () => {
  it('builds per-pane history paths under userData', () => {
    expect(shellHistoryDir('/data', 'host1')).toBe('/data/shell-history/host1')
    expect(shellHistoryFile('/data', 'host1', 'pane1')).toBe('/data/shell-history/host1/pane1')
  })
})
