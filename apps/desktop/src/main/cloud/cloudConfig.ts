export interface CloudConfig {
  apiUrl: string
  keycloakIssuer: string
  clientId: string
}

const DEFAULTS: CloudConfig = {
  apiUrl: 'http://127.0.0.1:8080',
  keycloakIssuer: 'http://127.0.0.1:8081/realms/consolieri',
  clientId: 'consolieri-desktop'
}

export function getCloudConfig(): CloudConfig {
  return {
    apiUrl: (process.env.CONSOLIERI_API_URL ?? DEFAULTS.apiUrl).replace(/\/+$/, ''),
    keycloakIssuer: (process.env.KEYCLOAK_ISSUER ?? DEFAULTS.keycloakIssuer).replace(/\/+$/, ''),
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? DEFAULTS.clientId
  }
}
