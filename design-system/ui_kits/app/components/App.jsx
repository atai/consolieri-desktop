const { Sidebar, TabBar, HostList, ConnectionPanel } = window;

const appStyles = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'var(--consoleri-bg)',
    color: 'var(--consoleri-fg)',
    fontFamily: 'var(--consoleri-font-sans)',
  },
  titlebar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    height: 32,
    background: 'var(--consoleri-surface-muted)',
    borderBottom: '1px solid var(--consoleri-border)',
    fontSize: 'var(--consoleri-font-size-sm)',
    color: 'var(--consoleri-muted)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--consoleri-fg)' },
  body: { display: 'flex', flex: 1, minHeight: 0 },
  main: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  workspace: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
};

function App() {
  const [activeTab, setActiveTab] = React.useState('Hosts');
  const [selectedHost, setSelectedHost] = React.useState({
    id: 'arcjenkins-test',
    name: 'arcjenkins-test',
    domain: 'arcjenkins-test.mycorp.internal',
    tag: 'jenkins',
  });
  const [search, setSearch] = React.useState('test');

  return (
    <div style={appStyles.shell} data-od-id="consoleri-app">
      <header style={appStyles.titlebar}>
        <div style={appStyles.brand}>
          <img src="../../assets/logo.svg" alt="" width={18} height={18} />
          Consolieri
        </div>
        <span>—</span>
      </header>
      <div style={appStyles.body}>
        <Sidebar activeId="hosts" />
        <div style={appStyles.main}>
          <TabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchValue={search}
            onSearchChange={setSearch}
          />
          <div style={appStyles.workspace}>
            <HostList selectedHostId={selectedHost?.id} onSelectHost={setSelectedHost} />
            <ConnectionPanel host={selectedHost} />
          </div>
        </div>
      </div>
    </div>
  );
}

window.App = App;
