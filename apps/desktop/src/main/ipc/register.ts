import type { BrowserWindow } from 'electron'
import { registerHostIpc } from './registerHostIpc'
import { registerVaultIpc } from './registerVaultIpc'
import { registerSessionIpc } from './registerSessionIpc'
import { registerKeysIpc } from './registerKeysIpc'
import { registerUxProfilesIpc } from './registerUxProfilesIpc'
import { registerPreferencesIpc } from './registerPreferencesIpc'
import { registerReportIpc } from './registerReportIpc'
import { registerAppIpc } from './registerAppIpc'
import { registerLocalShellsIpc } from './registerLocalShellsIpc'
import { registerScpIpc } from './registerScpIpc'
import { registerCloudIpc } from './registerCloudIpc'
import { registerControlIpc } from './registerControlIpc'

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  registerHostIpc(getWindow)
  registerVaultIpc()
  registerSessionIpc(getWindow)
  registerKeysIpc(getWindow)
  registerLocalShellsIpc()
  registerUxProfilesIpc()
  registerPreferencesIpc()
  registerReportIpc(getWindow)
  registerAppIpc(getWindow)
  registerCloudIpc()
  registerScpIpc()
  registerControlIpc(getWindow)
}
