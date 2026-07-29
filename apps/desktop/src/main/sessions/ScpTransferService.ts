import { basename, join } from 'node:path'
import { statSync } from 'node:fs'
import { dialog } from 'electron'
import type { SFTPWrapper } from 'ssh2'
import type { ScpTransferRequest, ScpTransferResult } from '../../shared/types'
import { hostRepository } from '../hosts/HostRepository'
import { profileRepository } from '../hosts/ProfileRepository'
import { connectSshForHostProfile } from './resolveProfileSshClient'

function posixJoin(dir: string, file: string): string {
  const normalized = dir.replace(/\\/g, '/').replace(/\/+$/, '')
  return `${normalized}/${file}`
}

function openSftp(client: import('ssh2').Client): Promise<SFTPWrapper> {
  return new Promise((resolve, reject) => {
    client.sftp((err, sftp) => {
      if (err) reject(err)
      else resolve(sftp)
    })
  })
}

function fastPut(sftp: SFTPWrapper, localPath: string, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

function fastGet(sftp: SFTPWrapper, remotePath: string, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sftp.fastGet(remotePath, localPath, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export class ScpTransferService {
  async pickLocalFile(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Select file',
      properties: ['openFile'],
      filters: [{ name: 'All files', extensions: ['*'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  }

  async pickLocalDir(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Select directory',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  }

  async transfer(request: ScpTransferRequest): Promise<ScpTransferResult> {
    const host = hostRepository.getHost(request.hostId)
    if (!host) {
      return { success: false, message: 'Host not found' }
    }

    const profiles = profileRepository.listProfiles(host.id)
    const profile = profiles.find((p) => p.id === request.profileId)
    if (!profile) {
      return { success: false, message: 'Profile not found' }
    }
    if (profile.protocol !== 'ssh') {
      return { success: false, message: 'SCP requires an SSH profile' }
    }

    let localPath: string
    let remotePath: string

    if (request.direction === 'upload') {
      localPath = request.sourcePath
      remotePath = posixJoin(request.destPath, basename(request.sourcePath))
    } else {
      localPath = join(request.destPath, basename(request.sourcePath))
      remotePath = request.sourcePath.replace(/\\/g, '/')
    }

    let bytes: number | undefined
    try {
      if (request.direction === 'upload') {
        bytes = statSync(localPath).size
      }
    } catch {
      return { success: false, message: `Local file not found: ${localPath}` }
    }

    const client = await connectSshForHostProfile(host, profile)

    try {
      const sftp = await openSftp(client)

      if (request.direction === 'upload') {
        await fastPut(sftp, localPath, remotePath)
        return {
          success: true,
          message: `Uploaded to ${remotePath}`,
          bytes
        }
      }

      await fastGet(sftp, remotePath, localPath)
      try {
        bytes = statSync(localPath).size
      } catch {
        // ignore size read failure after successful transfer
      }
      return {
        success: true,
        message: `Downloaded to ${localPath}`,
        bytes
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return { success: false, message }
    } finally {
      client.end()
    }
  }
}

export const scpTransferService = new ScpTransferService()
