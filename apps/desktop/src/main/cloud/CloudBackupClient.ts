import { cloudAuthService } from './CloudAuthService'
import { getCloudConfig } from './cloudConfig'
import {
  isCloudBackupEnvelope,
  type CloudBackupEnvelope
} from './SyncCrypto'

export interface CloudBackupListItem {
  id: string
  createdAt: string
  byteSize: number
  label: string | null
  deviceId: string | null
  schemaVersion: number
}

export class CloudBackupClient {
  private async authorizedFetch(path: string, init?: RequestInit): Promise<Response> {
    const accessToken = await cloudAuthService.getAccessToken()
    if (!accessToken) {
      throw new Error('Not signed in to Consolieri Cloud')
    }

    const config = getCloudConfig()
    const url = `${config.apiUrl}${path}`
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    let response = await fetch(url, { ...init, headers })
    if (response.status === 401) {
      const ok = await cloudAuthService.refreshSession()
      if (!ok) throw new Error('Cloud session expired. Please sign in again.')
      const retryToken = await cloudAuthService.getAccessToken()
      if (!retryToken) throw new Error('Cloud session expired. Please sign in again.')
      headers.set('Authorization', `Bearer ${retryToken}`)
      response = await fetch(url, { ...init, headers })
    }
    return response
  }

  async upload(envelope: CloudBackupEnvelope): Promise<CloudBackupListItem> {
    const response = await this.authorizedFetch('/v1/backups', {
      method: 'POST',
      body: JSON.stringify(envelope)
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Cloud backup upload failed: ${response.status} ${body.slice(0, 200)}`)
    }
    return (await response.json()) as CloudBackupListItem
  }

  async list(): Promise<CloudBackupListItem[]> {
    const response = await this.authorizedFetch('/v1/backups')
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Cloud backup list failed: ${response.status} ${body.slice(0, 200)}`)
    }
    const data = (await response.json()) as { backups?: CloudBackupListItem[] } | CloudBackupListItem[]
    if (Array.isArray(data)) return data
    return data.backups ?? []
  }

  async download(id: string): Promise<CloudBackupEnvelope> {
    const response = await this.authorizedFetch(`/v1/backups/${encodeURIComponent(id)}`)
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Cloud backup download failed: ${response.status} ${body.slice(0, 200)}`)
    }
    const data: unknown = await response.json()
    const candidates: unknown[] = [data]
    if (data && typeof data === 'object') {
      const row = data as Record<string, unknown>
      if ('envelope' in row) candidates.push(row.envelope)
      if ('backup' in row) candidates.push(row.backup)
    }
    for (const candidate of candidates) {
      if (isCloudBackupEnvelope(candidate)) return candidate
    }
    throw new Error('Cloud backup response did not include a valid encrypted envelope')
  }

  async delete(id: string): Promise<void> {
    const response = await this.authorizedFetch(`/v1/backups/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
    if (!response.ok && response.status !== 204) {
      const body = await response.text().catch(() => '')
      throw new Error(`Cloud backup delete failed: ${response.status} ${body.slice(0, 200)}`)
    }
  }
}

export const cloudBackupClient = new CloudBackupClient()
