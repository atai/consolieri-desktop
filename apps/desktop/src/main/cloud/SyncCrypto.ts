import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import {
  isAppExportDocument,
  normalizeAppExportDocument,
  serializeAppExportDocument,
  type AppExportDocument
} from '@consoleri/core'

export const CLOUD_BACKUP_SCHEMA_VERSION = 1
export const CLOUD_CONTENT_TYPE = 'application/vnd.consolieri.backup+encrypted'

export interface CloudBackupCryptoMeta {
  kdf: 'raw'
  cipher: 'aes-256-gcm'
  nonce: string
}

export interface CloudBackupEnvelope {
  schemaVersion: number
  crypto: CloudBackupCryptoMeta
  ciphertext: string
  label?: string
  appBundleVersion?: number
}

const SYNC_KEY_BYTES = 32
const NONCE_BYTES = 12

export function generateSyncKey(): Buffer {
  return randomBytes(SYNC_KEY_BYTES)
}

export function syncKeyToBase64(key: Buffer): string {
  return key.toString('base64')
}

export function syncKeyFromBase64(encoded: string): Buffer {
  const key = Buffer.from(encoded.trim(), 'base64')
  if (key.length !== SYNC_KEY_BYTES) {
    throw new Error('Invalid sync key: expected 32 bytes')
  }
  return key
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function sealAppDocument(doc: AppExportDocument, syncKey: Buffer): CloudBackupEnvelope {
  const plaintext = Buffer.from(serializeAppExportDocument(doc), 'utf8')
  const nonce = randomBytes(NONCE_BYTES)
  const cipher = createCipheriv('aes-256-gcm', syncKey, nonce)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const ciphertext = Buffer.concat([encrypted, tag])

  return {
    schemaVersion: CLOUD_BACKUP_SCHEMA_VERSION,
    crypto: {
      kdf: 'raw',
      cipher: 'aes-256-gcm',
      nonce: nonce.toString('base64')
    },
    ciphertext: ciphertext.toString('base64'),
    appBundleVersion: doc.version
  }
}

export function openAppDocument(envelope: CloudBackupEnvelope, syncKey: Buffer): AppExportDocument {
  if (envelope.schemaVersion !== CLOUD_BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported cloud backup schema version: ${envelope.schemaVersion}`)
  }
  if (envelope.crypto.cipher !== 'aes-256-gcm' || envelope.crypto.kdf !== 'raw') {
    throw new Error('Unsupported cloud backup crypto parameters')
  }

  const nonce = Buffer.from(envelope.crypto.nonce, 'base64')
  const raw = Buffer.from(envelope.ciphertext, 'base64')
  if (raw.length < 17) {
    throw new Error('Cloud backup ciphertext is truncated')
  }
  const tag = raw.subarray(raw.length - 16)
  const encrypted = raw.subarray(0, raw.length - 16)

  try {
    const decipher = createDecipheriv('aes-256-gcm', syncKey, nonce)
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
    const parsed: unknown = JSON.parse(plaintext)
    if (!isAppExportDocument(parsed)) {
      throw new Error('Decrypted cloud backup is not a valid app export document')
    }
    return normalizeAppExportDocument(parsed)
  } catch (error) {
    if (error instanceof Error && error.message.includes('not a valid')) throw error
    if (error instanceof Error && error.message.startsWith('Unsupported cloud')) throw error
    throw new Error(
      'Failed to decrypt cloud backup. Check that the sync (recovery) key matches this backup.'
    )
  }
}

export function isCloudBackupEnvelope(input: unknown): input is CloudBackupEnvelope {
  if (!input || typeof input !== 'object') return false
  const value = input as Record<string, unknown>
  if (typeof value.schemaVersion !== 'number') return false
  if (typeof value.ciphertext !== 'string') return false
  if (!value.crypto || typeof value.crypto !== 'object') return false
  const crypto = value.crypto as Record<string, unknown>
  return (
    typeof crypto.kdf === 'string' &&
    typeof crypto.cipher === 'string' &&
    typeof crypto.nonce === 'string'
  )
}
