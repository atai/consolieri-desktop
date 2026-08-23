import type {
  HostSessionPreset,
  HostSessionPresetInput,
  HostSessionPresetPane
} from '../../shared/types'
import { getDatabase } from '../db/database'

export class HostSessionPresetRepository {
  get(hostId: string): HostSessionPreset | null {
    const row = getDatabase()
      .prepare('SELECT * FROM host_session_presets WHERE host_id = ?')
      .get(hostId) as Record<string, unknown> | undefined
    if (!row) return null
    return this.rowToPreset(row)
  }

  save(hostId: string, input: HostSessionPresetInput): HostSessionPreset {
    const updatedAt = new Date().toISOString()
    getDatabase()
      .prepare(
        `INSERT INTO host_session_presets (host_id, layout_json, panes_json, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(host_id) DO UPDATE SET
           layout_json = excluded.layout_json,
           panes_json = excluded.panes_json,
           updated_at = excluded.updated_at`
      )
      .run(hostId, JSON.stringify(input.layout), JSON.stringify(input.panes), updatedAt)
    return this.get(hostId)!
  }

  delete(hostId: string): void {
    getDatabase().prepare('DELETE FROM host_session_presets WHERE host_id = ?').run(hostId)
  }

  private rowToPreset(row: Record<string, unknown>): HostSessionPreset {
    let panes: HostSessionPresetPane[] = []
    try {
      panes = JSON.parse((row.panes_json as string) || '[]') as HostSessionPresetPane[]
    } catch {
      panes = []
    }
    let layout: unknown = null
    try {
      layout = JSON.parse((row.layout_json as string) || 'null')
    } catch {
      layout = null
    }
    return {
      hostId: row.host_id as string,
      layout,
      panes,
      updatedAt: row.updated_at as string
    }
  }
}

export const hostSessionPresetRepository = new HostSessionPresetRepository()
