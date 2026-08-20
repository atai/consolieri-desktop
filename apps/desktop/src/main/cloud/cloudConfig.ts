import { app } from 'electron'

export interface CloudConfig {
  apiUrl: string
  keycloakIssuer: string
  clientId: string
}

interface DevOidcResponse {
  issuer: string
  desktopClientId: string
}

const PROD_DEFAULTS: CloudConfig = {
  apiUrl: 'https://api.consolieri.app',
  keycloakIssuer: 'https://oauth.ecooz.net/realms/consolieri',
  clientId: 'consolieri-desktop'
}

const DEV_API_URL = 'http://127.0.0.1:6011'

let cachedResolved: CloudConfig | null = null

function trimSlash(url: string): string {
  let out = url
  while (out.endsWith('/')) {
    out = out.slice(0, -1)
  }
  return out
}

function baseApiUrl(): string {
  if (process.env.CONSOLIERI_API_URL) {
    return trimSlash(process.env.CONSOLIERI_API_URL)
  }
  if (!app.isPackaged) {
    return DEV_API_URL
  }
  return PROD_DEFAULTS.apiUrl
}

/**
 * Sync config for API calls (session refresh, backups).
 * Issuer may be prod/env; prefer resolveCloudConfig() before OIDC login.
 */
export function getCloudConfig(): CloudConfig {
  if (cachedResolved) {
    return cachedResolved
  }

  return {
    apiUrl: baseApiUrl(),
    keycloakIssuer: trimSlash(process.env.KEYCLOAK_ISSUER ?? PROD_DEFAULTS.keycloakIssuer),
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? PROD_DEFAULTS.clientId
  }
}

/**
 * Resolve Keycloak issuer for login.
 * Unpackaged: GET {apiUrl}/dev/oidc unless KEYCLOAK_ISSUER is set.
 * Packaged: prod defaults (env overrides still win).
 */
export async function resolveCloudConfig(): Promise<CloudConfig> {
  if (cachedResolved) {
    return cachedResolved
  }

  const apiUrl = baseApiUrl()

  if (process.env.KEYCLOAK_ISSUER) {
    cachedResolved = {
      apiUrl,
      keycloakIssuer: trimSlash(process.env.KEYCLOAK_ISSUER),
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? PROD_DEFAULTS.clientId
    }
    return cachedResolved
  }

  if (app.isPackaged) {
    cachedResolved = {
      apiUrl,
      keycloakIssuer: PROD_DEFAULTS.keycloakIssuer,
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? PROD_DEFAULTS.clientId
    }
    return cachedResolved
  }

  const response = await fetch(`${apiUrl}/dev/oidc`)
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `OIDC discovery failed (${response.status}) at ${apiUrl}/dev/oidc: ${body.slice(0, 200) || response.statusText}. Is consolieri API running with APP_ENV=development?`
    )
  }

  const data = (await response.json()) as DevOidcResponse
  if (!data.issuer) {
    throw new Error('OIDC discovery response missing issuer')
  }

  cachedResolved = {
    apiUrl,
    keycloakIssuer: trimSlash(data.issuer),
    clientId:
      process.env.KEYCLOAK_CLIENT_ID ?? data.desktopClientId ?? PROD_DEFAULTS.clientId
  }
  return cachedResolved
}

/** Test helper — clear process-lifetime discovery cache. */
export function clearCloudConfigCache(): void {
  cachedResolved = null
}
