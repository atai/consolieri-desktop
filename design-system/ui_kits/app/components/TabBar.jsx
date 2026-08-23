const tabStyles = {
  bar: {
    display: 'flex',
    justifyContent: 'center',
    borderBottom: '1px solid var(--consoleri-border)',
    background: 'var(--consoleri-surface-muted)',
    minHeight: 'var(--consoleri-tabbar-height)',
  },
  tab: (active) => ({
    padding: '8px 24px',
    border: 'none',
    borderTop: `2px solid ${active ? 'var(--consoleri-tab-active)' : 'transparent'}`,
    background: 'transparent',
    color: active ? 'var(--consoleri-fg)' : 'var(--consoleri-muted)',
    fontSize: 'var(--consoleri-font-size-md)',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    fontFamily: 'var(--consoleri-font-sans)',
  }),
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    gap: 12,
    flexWrap: 'wrap',
  },
  search: {
    flex: 1,
    minWidth: 200,
    padding: '10px 12px',
    borderRadius: 'var(--consoleri-radius-sm)',
    border: '1px solid var(--consoleri-border)',
    background: 'var(--consoleri-bg)',
    color: 'var(--consoleri-fg)',
    fontSize: 'var(--consoleri-font-size-base)',
  },
  btnPrimary: {
    padding: '10px 16px',
    borderRadius: 'var(--consoleri-radius-sm)',
    border: 'none',
    background: 'var(--consoleri-accent)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 'var(--consoleri-font-size-md)',
  },
  btnGhost: {
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: 'var(--consoleri-muted)',
    cursor: 'pointer',
    fontSize: 'var(--consoleri-font-size-md)',
  },
};

const TABS = ['Hosts', 'Profiles', 'Keys'];

function TabBar({ activeTab = 'Hosts', onTabChange, searchValue = '', onSearchChange, onAddHost }) {
  return (
    <header data-od-id="tabbar">
      <div style={tabStyles.bar} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === activeTab}
            style={tabStyles.tab(tab === activeTab)}
            onClick={() => onTabChange?.(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div style={tabStyles.toolbar}>
        <input
          type="search"
          placeholder="Find host…"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          style={tabStyles.search}
          data-od-id="host-search"
        />
        <button type="button" style={tabStyles.btnPrimary} onClick={onAddHost} data-od-id="btn-add-host">
          + Host
        </button>
        <button type="button" style={tabStyles.btnGhost}>Refresh</button>
      </div>
    </header>
  );
}

window.TabBar = TabBar;
