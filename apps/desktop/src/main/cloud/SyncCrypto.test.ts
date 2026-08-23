import { describe, expect, it } from 'vitest'
import {
  createPkcePair,
  generateSyncKey,
  openAppDocument,
  sealAppDocument,
  syncKeyFromBase64,
  syncKeyToBase64
} from './SyncCrypto'
import { APP_BUNDLE_KIND, APP_BUNDLE_VERSION, type AppExportDocument } from '@consoleri/core'
import { fromPortableBlob, toPortableBlob } from './CloudPortableExport'

function sampleDoc(): AppExportDocument {
  return {
    kind: APP_BUNDLE_KIND,
    version: APP_BUNDLE_VERSION,
    exportedAt: '2026-01-01T00:00:00.000Z',
    settings: {
      app: {
        autoOpenConnectionLog: false,
        sessionOpenMode: 'workspace',
        keybindings: {},
        externalControl: { enabled: false }
      },
      hostListView: {
        version: 1,
        groupBy: 'none',
        selectedTags: [],
        selectedGroupId: 'all',
        selectedHostId: null,
        collapsedSections: [],
        sortBy: 'name',
        sortDir: 'asc'
      },
      mapView: { version: 1, appView: 'list', mapMode: 'logical' },
      vault: {
        enabled: false,
        address: '',
        namespace: '',
        defaultKvMount: 'secret',
        secretPathPrefix: 'consoleri',
        defaultBackend: 'local',
        auth: { method: 'token', hasToken: false },
        tlsSkipVerify: false
      },
      activeUxProfileId: null,
      uxProfiles: []
    },
    secrets: [{ ref: 'profile:abc:password', encryptedBlob: toPortableBlob('s3cret') }],
    hosts: {
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      groups: [],
      hosts: [],
      profiles: [],
      links: []
    },
    reports: [],
    workspace: null
  }
}

describe('SyncCrypto', () => {
  it('creates a PKCE pair with base64url verifier and challenge', () => {
    const { verifier, challenge } = createPkcePair()
    expect(verifier.length).toBeGreaterThan(20)
    expect(challenge.length).toBeGreaterThan(20)
    expect(verifier).not.toContain('+')
    expect(challenge).not.toContain('+')
  })

  it('round-trips seal/open with the same sync key', () => {
    const key = generateSyncKey()
    const doc = sampleDoc()
    const envelope = sealAppDocument(doc, key)
    expect(envelope.schemaVersion).toBe(1)
    expect(envelope.crypto.cipher).toBe('aes-256-gcm')
    expect(envelope.crypto.kdf).toBe('raw')
    const opened = openAppDocument(envelope, key)
    expect(opened.secrets[0]?.ref).toBe('profile:abc:password')
    expect(fromPortableBlob(opened.secrets[0]!.encryptedBlob)).toBe('s3cret')
  })

  it('fails decrypt with the wrong key', () => {
    const envelope = sealAppDocument(sampleDoc(), generateSyncKey())
    expect(() => openAppDocument(envelope, generateSyncKey())).toThrow(/decrypt|sync/i)
  })

  it('validates sync key length', () => {
    expect(() => syncKeyFromBase64('abc')).toThrow(/32 bytes/)
    const key = generateSyncKey()
    expect(syncKeyFromBase64(syncKeyToBase64(key))).toEqual(key)
  })
})

describe('portable secret encoding', () => {
  it('encodes and decodes plaintext', () => {
    const blob = toPortableBlob('hello')
    expect(blob.startsWith('portable:v1:')).toBe(true)
    expect(fromPortableBlob(blob)).toBe('hello')
    expect(fromPortableBlob('machine-bound')).toBeNull()
  })
})
