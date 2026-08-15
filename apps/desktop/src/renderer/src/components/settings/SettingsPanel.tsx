import { useState } from 'react'
import { usePreferencesStore } from '../../stores/preferencesStore'
import { UxProfileManager } from '../ux/UxProfileManager'
import { VaultSettingsPanel } from '../vault/VaultSettingsPanel'
import { BackupSettingsPanel } from './BackupSettingsPanel'
import { CloudSettingsPanel } from './CloudSettingsPanel'
import { HotkeysTab } from './HotkeysTab'
import { IntegrationsPanel } from './IntegrationsPanel'
import { SessionOpenModeToggle } from '../hosts/SessionOpenModeToggle'

type SettingsTab = 'general' | 'hotkeys' | 'appearance' | 'vault' | 'backup' | 'cloud' | 'integrations'

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'hotkeys', label: 'Hotkeys' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'vault', label: 'Vault' },
  { id: 'backup', label: 'Backup' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'integrations', label: 'Integrations' }
]

function GeneralTab(): React.JSX.Element {
  const { settings, setAutoOpenConnectionLog, setSessionOpenMode } = usePreferencesStore()

  return (
    <div className="max-w-lg space-y-6 p-6">
      <div>
        <h2 className="mb-4 text-base font-semibold text-fg">Session</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg">Open sessions in</p>
              <p className="text-xs text-muted">
                Workspace tabs keep everything in one window; separate windows open each session
                independently
              </p>
            </div>
            <SessionOpenModeToggle mode={settings.sessionOpenMode} onChange={setSessionOpenMode} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg">Auto-open connection log</p>
              <p className="text-xs text-muted">
                Automatically show the connection log panel when a session opens
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoOpenConnectionLog}
              onClick={() => void setAutoOpenConnectionLog(!settings.autoOpenConnectionLog)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                settings.autoOpenConnectionLog ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings.autoOpenConnectionLog ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsPanel(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  return (
    <div className="flex h-full min-h-0 bg-surface">
      {/* Left tab rail */}
      <nav
        className="flex w-44 shrink-0 flex-col border-r border-border py-2"
        aria-label="Settings sections"
      >
        <div className="px-3 pb-2 pt-1">
          <h1 className="text-lg font-semibold text-fg">Settings</h1>
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-left text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-surface-raised text-fg'
                : 'text-muted hover:bg-surface-raised hover:text-fg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'hotkeys' && <HotkeysTab />}
        {activeTab === 'appearance' && <UxProfileManager />}
        {activeTab === 'vault' && <VaultSettingsPanel />}
        {activeTab === 'backup' && <BackupSettingsPanel />}
        {activeTab === 'cloud' && <CloudSettingsPanel />}
        {activeTab === 'integrations' && <IntegrationsPanel />}
      </div>
    </div>
  )
}
