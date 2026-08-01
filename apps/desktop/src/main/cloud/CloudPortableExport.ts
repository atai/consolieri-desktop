import { safeStorage } from 'electron'
import type { AppExportDocument, SecretExportItem } from '@consoleri/core'
import { isVaultRef } from '@consoleri/core'
import type { AppImportExportService } from '../settings/AppImportExportService'
import { localSecretBackend } from '../secrets/LocalSecretBackend'
import { isCloudSecureRef, cloudSecureStorage } from './CloudSecureStorage'
import { openAppDocument, sealAppDocument, syncKeyFromBase64, type CloudBackupEnvelope } from './SyncCrypto'

/** Marks a secret payload that was decrypted for portable (cross-machine) cloud transfer. */
export const PORTABLE_SECRET_PREFIX = 'portable:v1:'

function toPortableBlob(plaintext: string): string {
  return `${PORTABLE_SECRET_PREFIX}${Buffer.from(plaintext, 'utf8').toString('base64')}`
}

function fromPortableBlob(blob: string): string | null {
  if (!blob.startsWith(PORTABLE_SECRET_PREFIX)) return null
  return Buffer.from(blob.slice(PORTABLE_SECRET_PREFIX.length), 'base64').toString('utf8')
}

function isLocalDecryptableRef(ref: string): boolean {
  if (isCloudSecureRef(ref)) return false
  // HashiCorp Vault KV refs are path pointers, not local ciphertext.
  if (isVaultRef(ref)) return false
  return true
}

export class CloudPortableExport {
  constructor(private readonly appIE: AppImportExportService) {}

  async buildPortableDocument(): Promise<AppExportDocument> {
    const doc = this.appIE.exportAppBundle()
    const portableSecrets: SecretExportItem[] = []

    for (const secret of doc.secrets) {
      if (isCloudSecureRef(secret.ref)) continue
      if (!isLocalDecryptableRef(secret.ref)) {
        // Keep vault:kv2 refs as opaque pointers (encryptedBlob unused / empty).
        portableSecrets.push(secret)
        continue
      }

      const plaintext = await localSecretBackend.retrieve(secret.ref)
      if (plaintext == null) {
        // Skip undecryptable local blobs rather than uploading machine-bound ciphertext.
        continue
      }
      portableSecrets.push({
        ref: secret.ref,
        encryptedBlob: toPortableBlob(plaintext)
      })
    }

    return { ...doc, secrets: portableSecrets }
  }

  async sealForUpload(syncKeyBase64: string, label?: string): Promise<CloudBackupEnvelope> {
    const key = syncKeyFromBase64(syncKeyBase64)
    const doc = await this.buildPortableDocument()
    const envelope = sealAppDocument(doc, key)
    if (label) envelope.label = label
    return envelope
  }

  async restoreFromEnvelope(envelope: CloudBackupEnvelope, syncKeyBase64: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS secure storage is not available')
    }
    const key = syncKeyFromBase64(syncKeyBase64)
    const doc = openAppDocument(envelope, key)

    const rewrapped: SecretExportItem[] = []
    for (const secret of doc.secrets) {
      if (isCloudSecureRef(secret.ref)) continue

      const portable = fromPortableBlob(secret.encryptedBlob)
      if (portable != null) {
        const encrypted = safeStorage.encryptString(portable).toString('base64')
        rewrapped.push({ ref: secret.ref, encryptedBlob: encrypted })
        continue
      }

      // Non-portable (e.g. vault:kv2 placeholder) — keep as-is if present.
      if (secret.encryptedBlob) {
        rewrapped.push(secret)
      }
    }

    const preservedCloud = cloudSecureStorage.listCloudRefs()
    const merged = [
      ...rewrapped,
      ...preservedCloud.map((s) => ({ ref: s.ref, encryptedBlob: s.encryptedBlob }))
    ]

    // Write secrets first via replaceAll-compatible merge, then import rest.
    // importAppBundleReplace also replaces secrets — so we temporarily inject merged secrets into doc.
    const docForImport: AppExportDocument = { ...doc, secrets: merged }
    this.appIE.importAppBundleReplace(docForImport)
  }
}

export { fromPortableBlob, toPortableBlob, isLocalDecryptableRef }
