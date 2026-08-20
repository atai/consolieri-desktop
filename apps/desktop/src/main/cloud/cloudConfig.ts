export interface CloudConfig {
  apiUrl: string
  keycloakIssuer: string
  clientId: string
}

const DEFAULTS: CloudConfig = {
  apiUrl: 'https://api.consolieri.app',
  keycloakIssuer: 'https://oauth.ecooz.net/realms/consolieri',
  clientId: 'consolieri-desktop'
}

export function getCloudConfig(): CloudConfig {
  return {
    apiUrl: (process.env.CONSOLIERI_API_URL ?? DEFAULTS.apiUrl).replace(/\/+$/, ''),
    keycloakIssuer: (process.env.KEYCLOAK_ISSUER ?? DEFAULTS.keycloakIssuer).replace(/\/+$/, ''),
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? DEFAULTS.clientId
  }
}
