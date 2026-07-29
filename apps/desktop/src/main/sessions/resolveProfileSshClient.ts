import type { Client } from 'ssh2'
import { defaultPortForProtocol } from '@consoleri/core'
import type { ConnectionProfile, Host } from '../../shared/types'
import { hostRepository } from '../hosts/HostRepository'
import { profileRepository } from '../hosts/ProfileRepository'
import { credentialResolver, findSshProfile } from '../services/CredentialResolver'
import { connectSshClient, connectSshViaJump, toSshConnectConfig } from './SshConnectHelper'

export async function connectSshForHostProfile(host: Host, profile: ConnectionProfile): Promise<Client> {
  if (profile.protocol !== 'ssh') {
    throw new Error('SCP requires an SSH connection profile')
  }

  const credentials = await credentialResolver.resolveForProfile(profile)
  const targetConfig = toSshConnectConfig(
    host.hostname,
    host.port || defaultPortForProtocol('ssh'),
    credentials
  )

  if (profile.jumpHostId) {
    const jumpHost = hostRepository.getHost(profile.jumpHostId)
    if (!jumpHost) throw new Error(`Jump host not found: ${profile.jumpHostId}`)

    const jumpProfiles = profileRepository.listProfiles(profile.jumpHostId)
    const jumpProfile = findSshProfile(jumpProfiles, null)
    if (!jumpProfile) throw new Error('Jump host has no SSH profile')

    const jumpCredentials = await credentialResolver.resolveForProfile(jumpProfile)
    const bastionConfig = toSshConnectConfig(
      jumpHost.hostname,
      jumpHost.port || defaultPortForProtocol('ssh'),
      jumpCredentials
    )
    return connectSshViaJump(bastionConfig, targetConfig)
  }

  return connectSshClient(targetConfig)
}
