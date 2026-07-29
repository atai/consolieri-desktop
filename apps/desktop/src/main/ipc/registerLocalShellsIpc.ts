import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { localShellsService } from '../sessions/localShellsService'

export function registerLocalShellsIpc(): void {
  ipcMain.handle(IPC_CHANNELS.localShellsAvailable, () => localShellsService.available())
}

