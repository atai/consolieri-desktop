import { getDatabase } from '../db/database'
import { cloudAuthService } from './CloudAuthService'
import { cloudBackupClient, type CloudBackupListItem } from './CloudBackupClient'
import { CloudPortableExport } from './CloudPortableExport'
import { cloudSecureStorage } from './CloudSecureStorage'
import { appImportExportService } from '../settings/appImportExportServiceInstance'
import { syncKeyFromBase64, syncKeyToBase64, generateSyncKey } from './SyncCrypto'

const CLOUD_SYNC_SETTINGS_KEY = 'cloud_sync'
const DEBOUNCE_MS = 45_000

export interface CloudSyncSettings {
  enabled: boolean
  lastUploadAt: string | null
  lastError: string | null
}

export interface CloudStatus {
  signedIn: boolean
  email: string | null
  deviceId: string | null
  enabled: boolean
  hasSyncKey: boolean
  lastUploadAt: string | null
  lastError: string | null
  syncKeyCreated?: boolean
}

const DEFAULT_SETTINGS: CloudSyncSettings = {
  enabled: true,
  lastUploadAt: null,
  lastError: null
}

export class CloudSyncCoordinator {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private uploading = false
  private readonly portable = new CloudPortableExport(appImportExportService)

  getSettings(): CloudSyncSettings {
    const row = getDatabase()
      .prepare('SELECT value FROM app_preferences WHERE key = ?')
      .get(CLOUD_SYNC_SETTINGS_KEY) as { value: string } | undefined
    if (!row?.value) return { ...DEFAULT_SETTINGS }
    try {
      const parsed = JSON.parse(row.value) as Partial<CloudSyncSettings>
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SETTINGS.enabled,
        lastUploadAt: typeof parsed.lastUploadAt === 'string' ? parsed.lastUploadAt : null,
        lastError: typeof parsed.lastError === 'string' ? parsed.lastError : null
      }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  updateSettings(patch: Partial<CloudSyncSettings>): CloudSyncSettings {
    const current = this.getSettings()
    const next: CloudSyncSettings = {
      enabled: typeof patch.enabled === 'boolean' ? patch.enabled : current.enabled,
      lastUploadAt: patch.lastUploadAt !== undefined ? patch.lastUploadAt : current.lastUploadAt,
      lastError: patch.lastError !== undefined ? patch.lastError : current.lastError
    }
    getDatabase()
      .prepare(
        `INSERT INTO app_preferences (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run(CLOUD_SYNC_SETTINGS_KEY, JSON.stringify(next))
    return next
  }

  private setError(message: string | null): void {
    this.updateSettings({ lastError: message })
  }

  async getStatus(): Promise<CloudStatus> {
    const settings = this.getSettings()
    const signedIn = await cloudAuthService.isSignedIn()
    const syncKey = await cloudSecureStorage.getSyncKey()
    let email: string | null = cloudAuthService.getCachedUser()?.email ?? null
    let deviceId: string | null = cloudAuthService.getCachedDevice()?.id ?? null

    if (signedIn && (!email || !deviceId)) {
      const me = await cloudAuthService.fetchMe()
      email = me?.user.email ?? email
      deviceId = me?.device.id ?? deviceId
    }

    return {
      signedIn,
      email,
      deviceId,
      enabled: settings.enabled,
      hasSyncKey: Boolean(syncKey),
      lastUploadAt: settings.lastUploadAt,
      lastError: settings.lastError
    }
  }

  scheduleUpload(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      void this.upload('auto').catch(() => {
        // Errors already recorded in lastError for non-skip failures.
      })
    }, DEBOUNCE_MS)
  }

  async backupNow(): Promise<CloudBackupListItem> {
    return this.upload('manual')
  }

  private async upload(label: 'auto' | 'manual'): Promise<CloudBackupListItem> {
    const settings = this.getSettings()
    if (label === 'auto' && !settings.enabled) {
      throw new Error('skipped')
    }

    const signedIn = await cloudAuthService.isSignedIn()
    if (!signedIn) {
      if (label === 'auto') throw new Error('skipped')
      throw new Error('Not signed in to Consolieri Cloud')
    }

    const syncKey = await cloudSecureStorage.getSyncKey()
    if (!syncKey) {
      if (label === 'auto') throw new Error('skipped')
      throw new Error('No sync key. Import a recovery key or sign in to create one.')
    }

    if (this.uploading) {
      if (label === 'auto') throw new Error('skipped')
      throw new Error('A cloud backup is already in progress')
    }

    this.uploading = true
    try {
      const envelope = await this.portable.sealForUpload(syncKey, label)
      const item = await cloudBackupClient.upload(envelope)
      this.updateSettings({
        lastUploadAt: new Date().toISOString(),
        lastError: null
      })
      return item
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message !== 'skipped') {
        this.setError(message)
      }
      throw error
    } finally {
      this.uploading = false
    }
  }

  async listBackups(): Promise<CloudBackupListItem[]> {
    return cloudBackupClient.list()
  }

  async restoreBackup(id: string): Promise<void> {
    const syncKey = await cloudSecureStorage.getSyncKey()
    if (!syncKey) {
      throw new Error('No sync key. Import your recovery key before restoring.')
    }
    const envelope = await cloudBackupClient.download(id)
    await this.portable.restoreFromEnvelope(envelope, syncKey)
  }

  async deleteBackup(id: string): Promise<void> {
    await cloudBackupClient.delete(id)
  }

  async exportRecoveryKey(): Promise<string> {
    const key = await cloudSecureStorage.getSyncKey()
    if (!key) throw new Error('No sync key stored')
    return key
  }

  async importRecoveryKey(keyBase64: string): Promise<void> {
    // Validate length
    syncKeyFromBase64(keyBase64)
    await cloudSecureStorage.storeSyncKey(keyBase64.trim())
  }

  async clearSyncKey(): Promise<void> {
    await cloudSecureStorage.deleteSyncKey()
  }

  async createSyncKeyIfMissing(): Promise<string> {
    const existing = await cloudSecureStorage.getSyncKey()
    if (existing) return existing
    const key = syncKeyToBase64(generateSyncKey())
    await cloudSecureStorage.storeSyncKey(key)
    return key
  }

  /** Safe schedule for IPC mutation hooks — never throws to callers. */
  notifyDataChanged(): void {
    try {
      const settings = this.getSettings()
      if (!settings.enabled) return
      this.scheduleUpload()
    } catch {
      // ignore
    }
  }
}

export const cloudSyncCoordinator = new CloudSyncCoordinator()

/** Fire-and-forget hook for mutating IPC handlers. */
export function scheduleCloudUpload(): void {
  cloudSyncCoordinator.notifyDataChanged()
}
