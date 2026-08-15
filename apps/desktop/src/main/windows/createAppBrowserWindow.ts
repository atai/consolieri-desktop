import { BrowserWindow, type BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'
import { appIconPath } from '../appBranding'
import { CHROME_BG_HEX } from '../../shared/chromeHex'

export type AppPreloadName = 'index' | 'about' | 'log' | 'report'

export interface CreateAppBrowserWindowOptions extends BrowserWindowConstructorOptions {
  /** Preload script basename under out/preload (without .js). Default: index */
  preload?: AppPreloadName
}

/**
 * Shared BrowserWindow defaults for Consoleri chrome windows.
 * Callers pass size/title/parent and optional overrides.
 */
export function createAppBrowserWindow(
  options: CreateAppBrowserWindowOptions
): BrowserWindow {
  const { preload = 'index', webPreferences, ...rest } = options
  return new BrowserWindow({
    icon: appIconPath(),
    backgroundColor: CHROME_BG_HEX,
    autoHideMenuBar: true,
    ...rest,
    webPreferences: {
      preload: join(__dirname, `../preload/${preload}.js`),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      ...webPreferences
    }
  })
}
