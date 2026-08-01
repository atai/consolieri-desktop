import { safeStorage } from 'electron'
import { getDatabase } from '../db/database'

export const CLOUD_SECURE_REFS = {
  accessToken: 'cloud:access',
  refreshToken: 'cloud:refresh',
  syncKey: 'cloud:sync_key'
} as const

const CLOUD_REF_PREFIX = 'cloud:'

export function isCloudSecureRef(ref: string): boolean {
  return ref.startsWith(CLOUD_REF_PREFIX)
}

export class CloudSecureStorage {
  async store(ref: string, secret: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS secure storage is not available')
    }
    const encrypted = safeStorage.encryptString(secret).toString('base64')
    getDatabase()
      .prepare(`INSERT OR REPLACE INTO vault_secrets (ref, encrypted_blob) VALUES (?, ?)`)
      .run(ref, encrypted)
  }

  async retrieve(ref: string): Promise<string | null> {
    const row = getDatabase()
      .prepare(`SELECT encrypted_blob FROM vault_secrets WHERE ref = ?`)
      .get(ref) as { encrypted_blob: string } | undefined
    if (!row || !safeStorage.isEncryptionAvailable()) return null
    return safeStorage.decryptString(Buffer.from(row.encrypted_blob, 'base64'))
  }

  async delete(ref: string): Promise<void> {
    getDatabase().prepare(`DELETE FROM vault_secrets WHERE ref = ?`).run(ref)
  }

  storeAccessToken(token: string): Promise<void> {
    return this.store(CLOUD_SECURE_REFS.accessToken, token)
  }

  getAccessToken(): Promise<string | null> {
    return this.retrieve(CLOUD_SECURE_REFS.accessToken)
  }

  deleteAccessToken(): Promise<void> {
    return this.delete(CLOUD_SECURE_REFS.accessToken)
  }

  storeRefreshToken(token: string): Promise<void> {
    return this.store(CLOUD_SECURE_REFS.refreshToken, token)
  }

  getRefreshToken(): Promise<string | null> {
    return this.retrieve(CLOUD_SECURE_REFS.refreshToken)
  }

  deleteRefreshToken(): Promise<void> {
    return this.delete(CLOUD_SECURE_REFS.refreshToken)
  }

  storeSyncKey(keyBase64: string): Promise<void> {
    return this.store(CLOUD_SECURE_REFS.syncKey, keyBase64)
  }

  getSyncKey(): Promise<string | null> {
    return this.retrieve(CLOUD_SECURE_REFS.syncKey)
  }

  deleteSyncKey(): Promise<void> {
    return this.delete(CLOUD_SECURE_REFS.syncKey)
  }

  async clearSessionTokens(): Promise<void> {
    await this.deleteAccessToken()
    await this.deleteRefreshToken()
  }

  listCloudRefs(): Array<{ ref: string; encryptedBlob: string }> {
    const rows = getDatabase()
      .prepare(`SELECT ref, encrypted_blob FROM vault_secrets WHERE ref LIKE ?`)
      .all(`${CLOUD_REF_PREFIX}%`) as Array<{ ref: string; encrypted_blob: string }>
    return rows.map((r) => ({ ref: r.ref, encryptedBlob: r.encrypted_blob }))
  }
}

export const cloudSecureStorage = new CloudSecureStorage()
