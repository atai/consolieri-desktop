import { createHash, randomBytes } from 'node:crypto'
import { nanoid } from 'nanoid'
import { getDatabase } from '../db/database'
import type { ControlClientInfo } from '../../shared/types'

const TOKEN_KEY = 'control_api_token_hash'
const CLIENTS_KEY = 'control_clients'

export interface StoredControlClient {
  id: string
  name: string
  tokenHash: string
  alwaysAllow: boolean
  createdAt: string
  lastUsedAt: string | null
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function readJsonPref<T>(key: string, fallback: T): T {
  const row = getDatabase()
    .prepare('SELECT value FROM app_preferences WHERE key = ?')
    .get(key) as { value: string } | undefined
  if (!row?.value) return fallback
  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

function writeJsonPref(key: string, value: unknown): void {
  getDatabase()
    .prepare(
      `INSERT INTO app_preferences (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, JSON.stringify(value))
}

export function generateControlToken(): string {
  return randomBytes(32).toString('base64url')
}

export function getStoredTokenHash(): string | null {
  const row = getDatabase()
    .prepare('SELECT value FROM app_preferences WHERE key = ?')
    .get(TOKEN_KEY) as { value: string } | undefined
  return row?.value ?? null
}

export function setStoredTokenHash(token: string): void {
  getDatabase()
    .prepare(
      `INSERT INTO app_preferences (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(TOKEN_KEY, hashToken(token))
}

export function clearStoredTokenHash(): void {
  getDatabase().prepare('DELETE FROM app_preferences WHERE key = ?').run(TOKEN_KEY)
}

export function verifyToken(token: string): boolean {
  const expected = getStoredTokenHash()
  if (!expected) return false
  return hashToken(token) === expected
}

function listStoredClients(): StoredControlClient[] {
  return readJsonPref<StoredControlClient[]>(CLIENTS_KEY, [])
}

function saveClients(clients: StoredControlClient[]): void {
  writeJsonPref(CLIENTS_KEY, clients)
}

export function listControlClients(): ControlClientInfo[] {
  return listStoredClients().map(({ id, name, alwaysAllow, createdAt, lastUsedAt }) => ({
    id,
    name,
    alwaysAllow,
    createdAt,
    lastUsedAt
  }))
}

export function upsertControlClient(input: {
  name: string
  tokenHash?: string
  alwaysAllow?: boolean
}): StoredControlClient {
  const clients = listStoredClients()
  const existing = clients.find((c) => c.name === input.name)
  if (existing) {
    if (input.alwaysAllow !== undefined) existing.alwaysAllow = input.alwaysAllow
    if (input.tokenHash) existing.tokenHash = input.tokenHash
    existing.lastUsedAt = new Date().toISOString()
    saveClients(clients)
    return existing
  }
  const created: StoredControlClient = {
    id: nanoid(),
    name: input.name,
    tokenHash: input.tokenHash ?? '',
    alwaysAllow: input.alwaysAllow ?? false,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString()
  }
  clients.push(created)
  saveClients(clients)
  return created
}

export function touchControlClient(name: string): void {
  const clients = listStoredClients()
  const existing = clients.find((c) => c.name === name)
  if (!existing) return
  existing.lastUsedAt = new Date().toISOString()
  saveClients(clients)
}

export function setClientAlwaysAllow(clientId: string, alwaysAllow: boolean): ControlClientInfo | null {
  const clients = listStoredClients()
  const existing = clients.find((c) => c.id === clientId)
  if (!existing) return null
  existing.alwaysAllow = alwaysAllow
  saveClients(clients)
  return {
    id: existing.id,
    name: existing.name,
    alwaysAllow: existing.alwaysAllow,
    createdAt: existing.createdAt,
    lastUsedAt: existing.lastUsedAt
  }
}

export function revokeControlClient(clientId: string): boolean {
  const clients = listStoredClients()
  const next = clients.filter((c) => c.id !== clientId)
  if (next.length === clients.length) return false
  saveClients(next)
  return true
}

export function isClientAlwaysAllow(name: string): boolean {
  return listStoredClients().some((c) => c.name === name && c.alwaysAllow)
}

export function markClientAlwaysAllow(name: string): void {
  upsertControlClient({ name, alwaysAllow: true })
}
