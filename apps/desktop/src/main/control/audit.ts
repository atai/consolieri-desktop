import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { getDataDir } from '../paths'

export interface AuditEntry {
  at: string
  client: string
  method: string
  path: string
  outcome: string
  detail?: string
}

export function appendControlAudit(entry: Omit<AuditEntry, 'at'>): void {
  try {
    const dir = getDataDir()
    mkdirSync(dir, { recursive: true })
    const line = JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n'
    appendFileSync(join(dir, 'control-audit.log'), line, 'utf8')
  } catch (err) {
    console.error('[control] Failed to write audit log:', err)
  }
}
