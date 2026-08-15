import { createServer, type Server } from 'node:http'
import { hostname } from 'node:os'
import { shell } from 'electron'
import { APP_VERSION } from '../../shared/appVersion'
import { getCloudConfig } from './cloudConfig'
import { cloudSecureStorage } from './CloudSecureStorage'
import { createPkcePair, generateSyncKey, syncKeyToBase64 } from './SyncCrypto'
import { reportBestEffortFailure } from '../../shared/bestEffort'

export interface CloudUserInfo {
  id: string
  email: string | null
  name: string | null
}

export interface CloudDeviceInfo {
  id: string
  name: string
  platform: string
}

export interface CloudSessionResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: CloudUserInfo
  device: CloudDeviceInfo
  /** True when a new sync key was generated during this login. */
  syncKeyCreated: boolean
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  id_token?: string
  token_type?: string
}

interface SessionApiResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: CloudUserInfo
  device: CloudDeviceInfo
}

function randomPort(): number {
  return 49152 + Math.floor(Math.random() * 16384)
}

function deviceMeta(): { name: string; platform: string; appVersion: string } {
  return {
    name: hostname() || 'Consoleri Desktop',
    platform: process.platform,
    appVersion: APP_VERSION
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 200) || response.statusText}`)
  }
  return (await response.json()) as T
}

export class CloudAuthService {
  private memoryAccessToken: string | null = null
  private memoryExpiresAt = 0
  private cachedUser: CloudUserInfo | null = null
  private cachedDevice: CloudDeviceInfo | null = null
  private refreshTimer: ReturnType<typeof setTimeout> | null = null

  async getAccessToken(): Promise<string | null> {
    if (this.memoryAccessToken && Date.now() < this.memoryExpiresAt - 60_000) {
      return this.memoryAccessToken
    }
    const refreshed = await this.refreshSession()
    return refreshed ? this.memoryAccessToken : null
  }

  getCachedUser(): CloudUserInfo | null {
    return this.cachedUser
  }

  getCachedDevice(): CloudDeviceInfo | null {
    return this.cachedDevice
  }

  async isSignedIn(): Promise<boolean> {
    const refresh = await cloudSecureStorage.getRefreshToken()
    return Boolean(refresh)
  }

  async login(): Promise<CloudSessionResult> {
    const config = getCloudConfig()
    const { verifier, challenge } = createPkcePair()
    const port = randomPort()
    const redirectUri = `http://127.0.0.1:${port}/callback`
    const state = createPkcePair().verifier

    const authorizeUrl = new URL(`${config.keycloakIssuer}/protocol/openid-connect/auth`)
    authorizeUrl.searchParams.set('client_id', config.clientId)
    authorizeUrl.searchParams.set('redirect_uri', redirectUri)
    authorizeUrl.searchParams.set('response_type', 'code')
    authorizeUrl.searchParams.set('scope', 'openid profile email')
    authorizeUrl.searchParams.set('code_challenge', challenge)
    authorizeUrl.searchParams.set('code_challenge_method', 'S256')
    authorizeUrl.searchParams.set('state', state)

    const code = await this.waitForAuthorizationCode(port, authorizeUrl.toString(), state)

    const tokenUrl = `${config.keycloakIssuer}/protocol/openid-connect/token`
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    })

    const kcTokens = await fetchJson<TokenResponse>(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })

    if (!kcTokens.access_token) {
      throw new Error('Keycloak did not return an access token')
    }

    const session = await fetchJson<SessionApiResponse>(`${config.apiUrl}/v1/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: kcTokens.access_token,
        device: deviceMeta()
      })
    })

    await this.persistSession(session)
    const syncKeyCreated = await this.ensureSyncKey()

    return {
      ...session,
      syncKeyCreated
    }
  }

  async refreshSession(): Promise<boolean> {
    const refreshToken = await cloudSecureStorage.getRefreshToken()
    if (!refreshToken) {
      this.clearMemory()
      return false
    }

    const config = getCloudConfig()
    try {
      const session = await fetchJson<SessionApiResponse>(`${config.apiUrl}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      await this.persistSession(session)
      return true
    } catch {
      await cloudSecureStorage.clearSessionTokens()
      this.clearMemory()
      return false
    }
  }

  async logout(): Promise<void> {
    const config = getCloudConfig()
    const refreshToken = await cloudSecureStorage.getRefreshToken()
    const accessToken = this.memoryAccessToken ?? (await cloudSecureStorage.getAccessToken())

    if (refreshToken || accessToken) {
      try {
        await fetch(`${config.apiUrl}/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ refreshToken: refreshToken ?? undefined })
        })
      } catch (error) {
        reportBestEffortFailure('cloud logout revoke', error)
      }
    }

    await cloudSecureStorage.clearSessionTokens()
    this.clearMemory()
  }

  async fetchMe(): Promise<{ user: CloudUserInfo; device: CloudDeviceInfo } | null> {
    const accessToken = await this.getAccessToken()
    if (!accessToken) return null
    const config = getCloudConfig()
    try {
      const me = await fetchJson<{ user: CloudUserInfo; device: CloudDeviceInfo }>(
        `${config.apiUrl}/v1/me`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      this.cachedUser = me.user
      this.cachedDevice = me.device
      return me
    } catch {
      return null
    }
  }

  async ensureSyncKey(): Promise<boolean> {
    const existing = await cloudSecureStorage.getSyncKey()
    if (existing) return false
    const key = generateSyncKey()
    await cloudSecureStorage.storeSyncKey(syncKeyToBase64(key))
    return true
  }

  private async persistSession(session: SessionApiResponse): Promise<void> {
    await cloudSecureStorage.storeAccessToken(session.accessToken)
    await cloudSecureStorage.storeRefreshToken(session.refreshToken)
    this.memoryAccessToken = session.accessToken
    this.memoryExpiresAt = Date.now() + session.expiresIn * 1000
    this.cachedUser = session.user
    this.cachedDevice = session.device
    this.scheduleRefresh(session.expiresIn)
  }

  private scheduleRefresh(expiresIn: number): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer)
    const delayMs = Math.max(30_000, (expiresIn - 90) * 1000)
    this.refreshTimer = setTimeout(() => {
      void this.refreshSession()
    }, delayMs)
  }

  private clearMemory(): void {
    this.memoryAccessToken = null
    this.memoryExpiresAt = 0
    this.cachedUser = null
    this.cachedDevice = null
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  private waitForAuthorizationCode(
    port: number,
    authUrl: string,
    expectedState: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false
      let server: Server | null = null
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true
          server?.close()
          reject(new Error('Cloud login timed out'))
        }
      }, 120_000)

      server = createServer((req, res) => {
        if (!req.url?.startsWith('/callback')) {
          res.writeHead(404)
          res.end()
          return
        }

        const url = new URL(req.url, `http://127.0.0.1:${port}`)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const error = url.searchParams.get('error')

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Login failed')
          if (!settled) {
            settled = true
            clearTimeout(timeout)
            server?.close()
            reject(new Error(`Cloud login failed: ${error}`))
          }
          return
        }

        if (!code || state !== expectedState) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Invalid authorization response')
          if (!settled) {
            settled = true
            clearTimeout(timeout)
            server?.close()
            reject(new Error('Cloud login did not return a valid authorization code'))
          }
          return
        }

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<html><body><p>Consolieri Cloud login successful. You can close this tab.</p></body></html>'
        )

        if (!settled) {
          settled = true
          clearTimeout(timeout)
          server?.close()
          resolve(code)
        }
      })

      server.listen(port, '127.0.0.1', () => {
        void shell.openExternal(authUrl)
      })

      server.on('error', (err) => {
        if (!settled) {
          settled = true
          clearTimeout(timeout)
          reject(err)
        }
      })
    })
  }
}

export const cloudAuthService = new CloudAuthService()
