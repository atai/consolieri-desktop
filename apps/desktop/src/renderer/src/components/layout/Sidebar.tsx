import { useAppStore } from '../../stores/appStore'
import { HostBrowser } from '../hosts/HostBrowser'
import { KeyManager } from '../keys/KeyManager'
import { ProfileManager } from '../profiles/ProfileManager'

export function Sidebar(): React.JSX.Element {
  const { sidebarView, setSidebarView } = useAppStore()

  const tabClass = (view: typeof sidebarView): string =>
    `flex-1 px-2 py-2 text-xs font-medium sm:px-3 sm:text-sm ${
      sidebarView === view
        ? 'border-b-2 border-accent text-fg'
        : 'text-muted hover:text-fg-2'
    }`

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border">
      <div className="flex shrink-0 border-b border-border bg-bg">
        <button type="button" onClick={() => setSidebarView('hosts')} className={tabClass('hosts')}>
          Hosts
        </button>
        <button type="button" onClick={() => setSidebarView('profiles')} className={tabClass('profiles')}>
          Profiles
        </button>
        <button type="button" onClick={() => setSidebarView('keys')} className={tabClass('keys')}>
          Keys
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {sidebarView === 'hosts' && <HostBrowser />}
        {sidebarView === 'profiles' && <ProfileManager />}
        {sidebarView === 'keys' && <KeyManager />}
      </div>
    </div>
  )
}
