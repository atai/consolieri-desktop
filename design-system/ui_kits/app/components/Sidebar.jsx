const sidebarStyles = {
  rail: {
    width: 'var(--consoleri-sidebar-width)',
    minHeight: '100%',
    background: 'var(--consoleri-surface-muted)',
    borderRight: '1px solid var(--consoleri-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 0',
    gap: '8px',
    flexShrink: 0,
  },
  icon: (active) => ({
    width: 36,
    height: 36,
    borderRadius: 'var(--consoleri-radius-sm)',
    border: active ? 'none' : '1px solid var(--consoleri-border)',
    background: active ? 'var(--consoleri-accent)' : 'transparent',
    color: active ? '#fff' : 'var(--consoleri-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  }),
  img: (active) => ({
    width: 18,
    height: 18,
    display: 'block',
    filter: active ? 'brightness(0) invert(1)' : 'none',
    opacity: active ? 1 : 0.85,
  }),
  footer: {
    marginTop: 8,
    fontSize: 'var(--consoleri-font-size-xs)',
    color: 'var(--consoleri-muted)',
    paddingBottom: 8,
  },
};

const NAV_ITEMS = [
  { id: 'hosts', src: '../../assets/icons/sidebar-hosts.svg', label: 'Hosts' },
  { id: 'reports', src: '../../assets/icons/sidebar-profiles.svg', label: 'Reports' },
  { id: 'network', src: '../../assets/icons/sidebar-network.svg', label: 'Network map' },
];

function Sidebar({ activeId = 'hosts', onNavigate }) {
  return (
    <nav style={sidebarStyles.rail} data-od-id="sidebar" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          style={sidebarStyles.icon(item.id === activeId)}
          onClick={() => onNavigate?.(item.id)}
          aria-current={item.id === activeId ? 'page' : undefined}
        >
          <img src={item.src} alt="" style={sidebarStyles.img(item.id === activeId)} />
        </button>
      ))}
      <button type="button" title="Settings" style={{ ...sidebarStyles.icon(false), marginTop: 'auto' }}>
        <img src="../../assets/icons/sidebar-settings.svg" alt="" style={sidebarStyles.img(false)} />
      </button>
      <div style={sidebarStyles.footer}>v0.4.7</div>
    </nav>
  );
}

window.Sidebar = Sidebar;
