import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '../shared/types'
import type {
  AppSettings,
  Host,
  HostFilter,
  HostGroup,
  HostInput,
  HostSessionPreset,
  HostSessionPresetInput,
  LogEntry,
  OpenSessionRequest,
  ProfileInput,
  SessionInfo,
  WorkspaceState,
  ConnectionProfile,
  DeployKeyRequest,
  DeployKeyResult,
  AssignableHost,
  SshKeyInfo,
  WslDistro,
  UxProfile,
  UxProfileInput,
  HostListViewSettings,
  MapViewSettings,
  Report,
  ReportInput,
  ReportResult,
  ReportProgressEvent,
  VaultSettings,
  VaultSettingsUpdate,
  VaultStatus,
  LocalShellAvailability,
  BackupSettings,
  BackupInfo,
  CloudStatus,
  CloudSyncSettings,
  CloudBackupInfo,
  CloudLoginResult,
  ScpTransferRequest,
  ScpTransferResult,
  ScpRecentEntry,
  ControlServerStatus,
  ControlClientInfo,
  ControlConfirmRequest,
  ControlConfirmDecision,
  PaneBinding
} from '../shared/types'
import type { MosaicNode } from '@consoleri/core'
import type { HostsExportDocument, AppExportDocument } from '@consoleri/core'

export interface ConsoleriAPI {
  hosts: {
    list: (filter?: HostFilter) => Promise<Host[]>
    get: (id: string) => Promise<Host | null>
    create: (input: HostInput) => Promise<Host>
    update: (id: string, input: Partial<HostInput>) => Promise<Host>
    delete: (id: string) => Promise<void>
    import: (payload: unknown) => Promise<Host[]>
    importFromFile: () => Promise<{ hosts: Host[] } | { canceled: true }>
    export: () => Promise<HostsExportDocument>
    exportToFile: () => Promise<{ path: string } | { canceled: true }>
  }
  groups: {
    list: () => Promise<HostGroup[]>
    create: (name: string, parentId?: string) => Promise<HostGroup>
  }
  profiles: {
    list: (hostId?: string) => Promise<ConnectionProfile[]>
    create: (input: ProfileInput) => Promise<ConnectionProfile>
    update: (id: string, input: Partial<ProfileInput>) => Promise<ConnectionProfile>
    delete: (id: string) => Promise<void>
    link: (hostId: string, profileId: string) => Promise<void>
    unlink: (hostId: string, profileId: string) => Promise<void>
    listHosts: (profileId: string) => Promise<Host[]>
    duplicate: (
      sourceId: string,
      targetHostId?: string,
      name?: string
    ) => Promise<ConnectionProfile>
  }
  credentials: {
    store: (ref: string, secret: string) => Promise<void>
    delete: (ref: string) => Promise<void>
  }
  sessions: {
    open: (request: OpenSessionRequest, cols?: number, rows?: number) => Promise<SessionInfo>
    close: (sessionId: string) => Promise<void>
    write: (sessionId: string, data: string) => void
    resize: (sessionId: string, cols: number, rows: number) => void
    list: () => Promise<SessionInfo[]>
    reconnect: (sessionId: string) => Promise<SessionInfo | null>
    getConnectRequest: (sessionId: string) => Promise<OpenSessionRequest | null>
    snapshot: (snapshot: {
      id: string
      hostId: string | null
      profileId: string | null
      protocol: string
      title: string
      cwd: string | null
      cols: number
      rows: number
      scrollbackSerialized: string | null
    }) => Promise<void>
    getRdpCredentials: (profileId: string) => Promise<{ username: string; password: string } | null>
    getVncPassword: (profileId: string) => Promise<string | null>
    getLog: (sessionId: string) => Promise<LogEntry[]>
    appendLog: (
      sessionId: string,
      level: 'debug' | 'info' | 'warn' | 'error',
      message: string
    ) => Promise<void>
    openLogWindow: (sessionId: string) => Promise<void>
    openSessionWindow: (sessionId: string) => Promise<void>
    openHostWindow: (hostId: string) => Promise<void>
    getCwd: (sessionId: string) => Promise<string | null>
    onData: (cb: (payload: { id: string; data: string }) => void) => () => void
    onExit: (cb: (payload: { id: string; code: number }) => void) => () => void
    onStatus: (cb: (payload: { id: string; status: string; error?: string }) => void) => () => void
    onLog: (cb: (entry: LogEntry) => void) => () => void
  }
  hostPresets: {
    get: (hostId: string) => Promise<HostSessionPreset | null>
    save: (hostId: string, input: HostSessionPresetInput) => Promise<HostSessionPreset>
    delete: (hostId: string) => Promise<void>
  }
  shellHistory: {
    deletePane: (hostId: string, paneId: string) => Promise<void>
  }
  wsl: {
    list: () => Promise<WslDistro[]>
  }
  localShells: {
    available: () => Promise<LocalShellAvailability>
  }
  workspace: {
    save: (state: WorkspaceState, name?: string) => Promise<unknown>
    load: () => Promise<WorkspaceState>
    getActive: () => Promise<unknown>
  }
  keys: {
    list: () => Promise<SshKeyInfo[]>
    add: (path: string, label?: string) => Promise<SshKeyInfo>
    remove: (id: string) => Promise<void>
    pickFile: () => Promise<string | null>
    assign: (profileId: string, keyPath: string) => Promise<void>
    deploy: (request: DeployKeyRequest) => Promise<DeployKeyResult>
    storePassphrase: (keyPath: string, passphrase: string) => Promise<void>
    listAssignableHosts: () => Promise<AssignableHost[]>
  }
  uxProfiles: {
    list: (hostId?: string) => Promise<UxProfile[]>
    get: (id: string) => Promise<UxProfile | null>
    create: (input: UxProfileInput) => Promise<UxProfile>
    update: (id: string, input: Partial<UxProfileInput>) => Promise<UxProfile>
    delete: (id: string) => Promise<void>
    duplicate: (sourceId: string, name?: string) => Promise<UxProfile>
    getActive: () => Promise<UxProfile>
    setActive: (id: string) => Promise<UxProfile>
    listHosts: (profileId: string) => Promise<Host[]>
    linkHost: (hostId: string, profileId: string) => Promise<void>
    unlinkHost: (hostId: string) => Promise<void>
  }
  clipboard: {
    readText: () => Promise<string>
    writeText: (text: string) => Promise<void>
  }
  preferences: {
    getHostListView: () => Promise<HostListViewSettings>
    setHostListView: (patch: Partial<HostListViewSettings>) => Promise<HostListViewSettings>
    getMapView: () => Promise<MapViewSettings>
    setMapView: (patch: Partial<MapViewSettings>) => Promise<MapViewSettings>
    getAppSettings: () => Promise<AppSettings>
    setAppSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
  }
  reports: {
    list: () => Promise<Report[]>
    get: (id: string) => Promise<Report | null>
    create: (input: ReportInput) => Promise<Report>
    update: (id: string, patch: Partial<ReportInput>) => Promise<Report>
    delete: (id: string) => Promise<void>
    run: (reportId: string) => Promise<ReportResult>
    openWindow: (reportId: string) => Promise<void>
    onProgress: (cb: (event: ReportProgressEvent) => void) => () => void
    onUpdated: (cb: (report: Report) => void) => () => void
  }
  vault: {
    getSettings: () => Promise<VaultSettings>
    updateSettings: (patch: VaultSettingsUpdate) => Promise<VaultSettings>
    testConnection: () => Promise<VaultStatus>
    getStatus: () => Promise<VaultStatus>
    login: () => Promise<void>
    logout: () => Promise<void>
  }
  app: {
    export: () => Promise<AppExportDocument>
    exportToFile: () => Promise<{ path: string } | { canceled: true }>
    importFromFile: () => Promise<void>
    openAbout: () => Promise<void>
    notifyReady: () => void
  }
  backup: {
    getSettings: () => Promise<BackupSettings>
    updateSettings: (patch: Partial<BackupSettings>) => Promise<BackupSettings>
    list: () => Promise<BackupInfo[]>
    createNow: () => Promise<BackupInfo>
    restore: (id: string) => Promise<void>
    delete: (id: string) => Promise<void>
    openFolder: () => Promise<void>
  }
  cloud: {
    getStatus: () => Promise<CloudStatus>
    login: () => Promise<CloudLoginResult>
    logout: () => Promise<CloudStatus>
    getSettings: () => Promise<CloudSyncSettings>
    updateSettings: (patch: Partial<CloudSyncSettings>) => Promise<CloudSyncSettings>
    backupNow: () => Promise<CloudBackupInfo>
    listBackups: () => Promise<CloudBackupInfo[]>
    restoreBackup: (id: string) => Promise<void>
    deleteBackup: (id: string) => Promise<void>
    exportRecoveryKey: () => Promise<string>
    importRecoveryKey: (key: string) => Promise<void>
    clearSyncKey: () => Promise<void>
  }
  scp: {
    pickFile: () => Promise<string | null>
    pickDir: () => Promise<string | null>
    transfer: (request: ScpTransferRequest) => Promise<ScpTransferResult>
    getRecent: (profileId: string) => Promise<ScpRecentEntry | null>
    setRecent: (profileId: string, entry: ScpRecentEntry) => Promise<void>
  }
  control: {
    getStatus: () => Promise<ControlServerStatus>
    enable: () => Promise<{ port: number; token: string }>
    disable: () => Promise<void>
    rotateToken: () => Promise<{ token: string }>
    getLastToken: () => Promise<string | null>
    listClients: () => Promise<ControlClientInfo[]>
    revokeClient: (clientId: string) => Promise<{ ok: boolean }>
    setClientAlwaysAllow: (
      clientId: string,
      alwaysAllow: boolean
    ) => Promise<ControlClientInfo | null>
    getWorkspaceWindow: (windowId: string) => Promise<{
      layout: MosaicNode<string> | null
      panes: PaneBinding[]
      sessions: SessionInfo[]
      title: string
    } | null>
    onConfirmRequest: (cb: (request: ControlConfirmRequest) => void) => () => void
    respondConfirm: (requestId: string, decision: ControlConfirmDecision) => Promise<void>
  }
}

const consoleri: ConsoleriAPI = {
  hosts: {
    list: (filter) => ipcRenderer.invoke(IPC_CHANNELS.hostsList, filter ?? {}),
    get: (id) => ipcRenderer.invoke(IPC_CHANNELS.hostsGet, id),
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.hostsCreate, input),
    update: (id, input) => ipcRenderer.invoke(IPC_CHANNELS.hostsUpdate, id, input),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.hostsDelete, id),
    import: (payload) => ipcRenderer.invoke(IPC_CHANNELS.hostsImport, payload),
    importFromFile: () => ipcRenderer.invoke(IPC_CHANNELS.hostsImportFromFile),
    export: () => ipcRenderer.invoke(IPC_CHANNELS.hostsExport),
    exportToFile: () => ipcRenderer.invoke(IPC_CHANNELS.hostsExportToFile)
  },
  groups: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.groupsList),
    create: (name, parentId) => ipcRenderer.invoke(IPC_CHANNELS.groupsCreate, name, parentId)
  },
  profiles: {
    list: (hostId) => ipcRenderer.invoke(IPC_CHANNELS.profilesList, hostId),
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.profilesCreate, input),
    update: (id, input) => ipcRenderer.invoke(IPC_CHANNELS.profilesUpdate, id, input),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.profilesDelete, id),
    link: (hostId, profileId) => ipcRenderer.invoke(IPC_CHANNELS.profilesLink, hostId, profileId),
    unlink: (hostId, profileId) =>
      ipcRenderer.invoke(IPC_CHANNELS.profilesUnlink, hostId, profileId),
    listHosts: (profileId) => ipcRenderer.invoke(IPC_CHANNELS.profilesListHosts, profileId),
    duplicate: (sourceId, targetHostId, name) =>
      ipcRenderer.invoke(IPC_CHANNELS.profilesDuplicate, sourceId, targetHostId, name)
  },
  credentials: {
    store: (ref, secret) => ipcRenderer.invoke(IPC_CHANNELS.credentialsStore, ref, secret),
    delete: (ref) => ipcRenderer.invoke(IPC_CHANNELS.credentialsDelete, ref)
  },
  sessions: {
    open: (request, cols, rows) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsOpen, request, cols, rows),
    close: (sessionId) => ipcRenderer.invoke(IPC_CHANNELS.sessionsClose, sessionId),
    write: (sessionId, data) => ipcRenderer.send(IPC_CHANNELS.sessionsWrite, sessionId, data),
    resize: (sessionId, cols, rows) =>
      ipcRenderer.send(IPC_CHANNELS.sessionsResize, sessionId, cols, rows),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.sessionsList),
    reconnect: (sessionId) => ipcRenderer.invoke(IPC_CHANNELS.sessionsReconnect, sessionId),
    getConnectRequest: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsGetConnectRequest, sessionId),
    snapshot: (snapshot) => ipcRenderer.invoke(IPC_CHANNELS.sessionsSnapshot, snapshot),
    getRdpCredentials: (profileId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsRdpCredentials, profileId),
    getVncPassword: (profileId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsVncPassword, profileId),
    getLog: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessionsLogGet, sessionId),
    appendLog: (sessionId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsLogAppend, sessionId, level, message),
    openLogWindow: (sessionId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsLogOpenWindow, sessionId),
    openSessionWindow: (sessionId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsOpenSessionWindow, sessionId),
    openHostWindow: (hostId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.sessionsOpenHostWindow, hostId),
    getCwd: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.sessionsGetCwd, sessionId),
    onData: (cb) => {
      const listener = (_: unknown, payload: { id: string; data: string }): void => {
        cb(payload)
      }
      ipcRenderer.on(IPC_CHANNELS.sessionData, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.sessionData, listener)
    },
    onExit: (cb) => {
      const listener = (_: unknown, payload: { id: string; code: number }): void => {
        cb(payload)
      }
      ipcRenderer.on(IPC_CHANNELS.sessionExit, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.sessionExit, listener)
    },
    onStatus: (cb) => {
      const listener = (
        _: unknown,
        payload: { id: string; status: string; error?: string }
      ): void => {
        cb(payload)
      }
      ipcRenderer.on(IPC_CHANNELS.sessionStatus, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.sessionStatus, listener)
    },
    onLog: (cb) => {
      const listener = (_: unknown, entry: LogEntry): void => {
        cb(entry)
      }
      ipcRenderer.on(IPC_CHANNELS.sessionLog, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.sessionLog, listener)
    }
  },
  hostPresets: {
    get: (hostId) => ipcRenderer.invoke(IPC_CHANNELS.hostPresetsGet, hostId),
    save: (hostId, input) => ipcRenderer.invoke(IPC_CHANNELS.hostPresetsSave, hostId, input),
    delete: (hostId) => ipcRenderer.invoke(IPC_CHANNELS.hostPresetsDelete, hostId)
  },
  shellHistory: {
    deletePane: (hostId, paneId) =>
      ipcRenderer.invoke(IPC_CHANNELS.shellHistoryDeletePane, hostId, paneId)
  },
  wsl: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.wslList)
  },
  localShells: {
    available: () => ipcRenderer.invoke(IPC_CHANNELS.localShellsAvailable)
  },
  workspace: {
    save: (state, name) => ipcRenderer.invoke(IPC_CHANNELS.workspaceSave, state, name),
    load: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceLoad),
    getActive: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceGetActive)
  },
  keys: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.keysList),
    add: (path, label) => ipcRenderer.invoke(IPC_CHANNELS.keysAdd, path, label),
    remove: (id) => ipcRenderer.invoke(IPC_CHANNELS.keysRemove, id),
    pickFile: () => ipcRenderer.invoke(IPC_CHANNELS.keysPickFile),
    assign: (profileId, keyPath) => ipcRenderer.invoke(IPC_CHANNELS.keysAssign, profileId, keyPath),
    deploy: (request) => ipcRenderer.invoke(IPC_CHANNELS.keysDeploy, request),
    storePassphrase: (keyPath, passphrase) =>
      ipcRenderer.invoke(IPC_CHANNELS.keysStorePassphrase, keyPath, passphrase),
    listAssignableHosts: () => ipcRenderer.invoke(IPC_CHANNELS.keysAssignableHosts)
  },
  uxProfiles: {
    list: (hostId) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesList, hostId),
    get: (id) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesGet, id),
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesCreate, input),
    update: (id, input) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesUpdate, id, input),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesDelete, id),
    duplicate: (sourceId, name) =>
      ipcRenderer.invoke(IPC_CHANNELS.uxProfilesDuplicate, sourceId, name),
    getActive: () => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesGetActive),
    setActive: (id) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesSetActive, id),
    listHosts: (profileId) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesListHosts, profileId),
    linkHost: (hostId, profileId) =>
      ipcRenderer.invoke(IPC_CHANNELS.uxProfilesLinkHost, hostId, profileId),
    unlinkHost: (hostId) => ipcRenderer.invoke(IPC_CHANNELS.uxProfilesUnlinkHost, hostId)
  },
  clipboard: {
    readText: () => ipcRenderer.invoke(IPC_CHANNELS.clipboardReadText),
    writeText: (text) => ipcRenderer.invoke(IPC_CHANNELS.clipboardWriteText, text)
  },
  preferences: {
    getHostListView: () => ipcRenderer.invoke(IPC_CHANNELS.preferencesGetHostListView),
    setHostListView: (patch) => ipcRenderer.invoke(IPC_CHANNELS.preferencesSetHostListView, patch),
    getMapView: () => ipcRenderer.invoke(IPC_CHANNELS.preferencesGetMapView),
    setMapView: (patch) => ipcRenderer.invoke(IPC_CHANNELS.preferencesSetMapView, patch),
    getAppSettings: () => ipcRenderer.invoke(IPC_CHANNELS.preferencesGetAppSettings),
    setAppSettings: (patch) => ipcRenderer.invoke(IPC_CHANNELS.preferencesSetAppSettings, patch)
  },
  reports: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.reportsList),
    get: (id) => ipcRenderer.invoke(IPC_CHANNELS.reportsGet, id),
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.reportsCreate, input),
    update: (id, patch) => ipcRenderer.invoke(IPC_CHANNELS.reportsUpdate, id, patch),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.reportsDelete, id),
    run: (reportId) => ipcRenderer.invoke(IPC_CHANNELS.reportsRun, reportId),
    openWindow: (reportId) => ipcRenderer.invoke(IPC_CHANNELS.reportsOpenWindow, reportId),
    onProgress: (cb) => {
      const listener = (_: unknown, event: ReportProgressEvent): void => {
        cb(event)
      }
      ipcRenderer.on(IPC_CHANNELS.reportProgress, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.reportProgress, listener)
    },
    onUpdated: (cb) => {
      const listener = (_: unknown, report: Report): void => {
        cb(report)
      }
      ipcRenderer.on(IPC_CHANNELS.reportUpdated, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.reportUpdated, listener)
    }
  },
  vault: {
    getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.vaultGetSettings),
    updateSettings: (patch) => ipcRenderer.invoke(IPC_CHANNELS.vaultUpdateSettings, patch),
    testConnection: () => ipcRenderer.invoke(IPC_CHANNELS.vaultTestConnection),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.vaultStatus),
    login: () => ipcRenderer.invoke(IPC_CHANNELS.vaultLogin),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.vaultLogout)
  },
  app: {
    export: () => ipcRenderer.invoke(IPC_CHANNELS.appExport),
    exportToFile: () => ipcRenderer.invoke(IPC_CHANNELS.appExportToFile),
    importFromFile: () => ipcRenderer.invoke(IPC_CHANNELS.appImportFromFile),
    openAbout: () => ipcRenderer.invoke(IPC_CHANNELS.appOpenAbout),
    notifyReady: () => {
      ipcRenderer.send(IPC_CHANNELS.appRendererReady)
    }
  },
  backup: {
    getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.backupGetSettings),
    updateSettings: (patch) => ipcRenderer.invoke(IPC_CHANNELS.backupUpdateSettings, patch),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.backupList),
    createNow: () => ipcRenderer.invoke(IPC_CHANNELS.backupCreateNow),
    restore: (id) => ipcRenderer.invoke(IPC_CHANNELS.backupRestore, id),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.backupDelete, id),
    openFolder: () => ipcRenderer.invoke(IPC_CHANNELS.backupOpenFolder)
  },
  cloud: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.cloudGetStatus),
    login: () => ipcRenderer.invoke(IPC_CHANNELS.cloudLogin),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.cloudLogout),
    getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.cloudGetSettings),
    updateSettings: (patch) => ipcRenderer.invoke(IPC_CHANNELS.cloudUpdateSettings, patch),
    backupNow: () => ipcRenderer.invoke(IPC_CHANNELS.cloudBackupNow),
    listBackups: () => ipcRenderer.invoke(IPC_CHANNELS.cloudListBackups),
    restoreBackup: (id) => ipcRenderer.invoke(IPC_CHANNELS.cloudRestoreBackup, id),
    deleteBackup: (id) => ipcRenderer.invoke(IPC_CHANNELS.cloudDeleteBackup, id),
    exportRecoveryKey: () => ipcRenderer.invoke(IPC_CHANNELS.cloudExportRecoveryKey),
    importRecoveryKey: (key) => ipcRenderer.invoke(IPC_CHANNELS.cloudImportRecoveryKey, key),
    clearSyncKey: () => ipcRenderer.invoke(IPC_CHANNELS.cloudClearSyncKey)
  },
  scp: {
    pickFile: () => ipcRenderer.invoke(IPC_CHANNELS.scpPickFile),
    pickDir: () => ipcRenderer.invoke(IPC_CHANNELS.scpPickDir),
    transfer: (request) => ipcRenderer.invoke(IPC_CHANNELS.scpTransfer, request),
    getRecent: (profileId) => ipcRenderer.invoke(IPC_CHANNELS.scpGetRecent, profileId),
    setRecent: (profileId, entry) => ipcRenderer.invoke(IPC_CHANNELS.scpSetRecent, profileId, entry)
  },
  control: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.controlGetStatus),
    enable: () => ipcRenderer.invoke(IPC_CHANNELS.controlEnable),
    disable: () => ipcRenderer.invoke(IPC_CHANNELS.controlDisable),
    rotateToken: () => ipcRenderer.invoke(IPC_CHANNELS.controlRotateToken),
    getLastToken: () => ipcRenderer.invoke(IPC_CHANNELS.controlGetLastToken),
    listClients: () => ipcRenderer.invoke(IPC_CHANNELS.controlListClients),
    revokeClient: (clientId) => ipcRenderer.invoke(IPC_CHANNELS.controlRevokeClient, clientId),
    setClientAlwaysAllow: (clientId, alwaysAllow) =>
      ipcRenderer.invoke(IPC_CHANNELS.controlSetClientAlwaysAllow, clientId, alwaysAllow),
    getWorkspaceWindow: (windowId) =>
      ipcRenderer.invoke(IPC_CHANNELS.controlGetWorkspaceWindow, windowId),
    onConfirmRequest: (cb) => {
      const listener = (_: unknown, request: ControlConfirmRequest): void => {
        cb(request)
      }
      ipcRenderer.on(IPC_CHANNELS.controlConfirmRequest, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.controlConfirmRequest, listener)
    },
    respondConfirm: (requestId, decision) =>
      ipcRenderer.invoke(IPC_CHANNELS.controlConfirmResponse, requestId, decision)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('consoleri', consoleri)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore legacy non-isolated
  window.electron = electronAPI
  // @ts-ignore legacy non-isolated
  window.consoleri = consoleri
}
