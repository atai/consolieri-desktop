import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_COMMAND_HISTORY_LIMIT, MAX_COMMAND_HISTORY_LIMIT } from '@consoleri/core'

vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/test-consoleri'
  }
}))

import { getDatabase, resetDatabaseForTest, setDatabaseForTest } from '../db/database'
import { AppPreferencesRepository } from './AppPreferencesRepository'

describe('AppPreferencesRepository app settings', () => {
  let repo: AppPreferencesRepository

  beforeEach(() => {
    setDatabaseForTest(':memory:')
    repo = new AppPreferencesRepository()
  })

  afterEach(() => {
    resetDatabaseForTest()
  })

  it('returns the default command history limit when no settings row exists', () => {
    expect(repo.getAppSettings().commandHistoryLimit).toBe(DEFAULT_COMMAND_HISTORY_LIMIT)
  })

  it('stores a limit and keeps the other settings when the patch omits them', () => {
    repo.setAppSettings({ autoOpenConnectionLog: true, sessionOpenMode: 'window' })
    const next = repo.setAppSettings({ commandHistoryLimit: 40 })
    expect(next.commandHistoryLimit).toBe(40)
    expect(next.autoOpenConnectionLog).toBe(true)
    expect(next.sessionOpenMode).toBe('window')
    expect(repo.getAppSettings().commandHistoryLimit).toBe(40)
  })

  it('clamps a limit above the maximum', () => {
    const next = repo.setAppSettings({ commandHistoryLimit: MAX_COMMAND_HISTORY_LIMIT + 50 })
    expect(next.commandHistoryLimit).toBe(MAX_COMMAND_HISTORY_LIMIT)
  })

  it('returns defaults when stored settings JSON is invalid', () => {
    getDatabase()
      .prepare(
        `INSERT INTO app_preferences (key, value) VALUES ('app_settings', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run('{')
    expect(repo.getAppSettings().commandHistoryLimit).toBe(DEFAULT_COMMAND_HISTORY_LIMIT)
    expect(repo.getAppSettings().sessionOpenMode).toBe('workspace')
  })
})
