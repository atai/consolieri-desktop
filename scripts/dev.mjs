import { spawnPnpm } from './pnpm.mjs'

/** Fixed local consolieri API (sibling stack). Keycloak issuer comes from GET /dev/oidc. */
const DEV_API_URL = 'http://127.0.0.1:6011'

const cloudEnv = process.env.CONSOLIERI_API_URL
  ? null
  : { CONSOLIERI_API_URL: DEV_API_URL }

if (cloudEnv) {
  console.log(`[dev] CONSOLIERI_API_URL=${DEV_API_URL} (Keycloak via GET /dev/oidc)`)
}

console.log('[dev] Building latest app…')
const buildCode = spawnPnpm(
  ['--filter', '@consoleri/desktop', 'run', 'build:app'],
  undefined,
  cloudEnv ?? undefined
)
if (buildCode !== 0) process.exit(buildCode)

console.log('[dev] Starting dev server…')
process.exit(
  spawnPnpm(
    ['--filter', '@consoleri/desktop', 'run', 'dev:watch'],
    undefined,
    cloudEnv ?? undefined
  )
)
