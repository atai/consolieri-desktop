const panelStyles = {
  panel: {
    borderTop: '1px solid var(--consoleri-border-strong)',
    background: 'var(--consoleri-surface-raised)',
    boxShadow: 'var(--consoleri-shadow-panel)',
    padding: '16px 20px',
    minHeight: 'var(--consoleri-connection-panel-min)',
  },
  label: {
    color: 'var(--consoleri-accent)',
    fontSize: 'var(--consoleri-font-size-sm)',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  hostName: { fontSize: 'var(--consoleri-font-size-xl)', fontWeight: 700, marginBottom: 4 },
  address: { fontSize: 'var(--consoleri-font-size-md)', color: 'var(--consoleri-muted)', marginBottom: 16 },
  accent: { color: 'var(--consoleri-accent)' },
  sectionTitle: {
    fontSize: 'var(--consoleri-font-size-sm)',
    fontWeight: 700,
    color: 'var(--consoleri-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 10,
    marginTop: 8,
  },
  profileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--consoleri-border)',
  },
  badge: {
    fontFamily: 'var(--consoleri-font-mono)',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 'var(--consoleri-radius-pill)',
    background: 'var(--consoleri-surface)',
    border: '1px solid var(--consoleri-border)',
    color: 'var(--consoleri-muted)',
    marginLeft: 8,
  },
  keyFile: { fontSize: 'var(--consoleri-font-size-sm)', color: 'var(--consoleri-muted)', marginTop: 2 },
  actions: { display: 'flex', gap: 6 },
  iconBtn: (primary) => ({
    width: 32,
    height: 32,
    borderRadius: 'var(--consoleri-radius-sm)',
    border: '1px solid var(--consoleri-border)',
    background: primary ? 'var(--consoleri-accent)' : 'var(--consoleri-surface)',
    color: primary ? '#fff' : 'var(--consoleri-muted)',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

const DEFAULT_PROFILES = [
  { id: 'relauto', name: 'Relauto key auth', protocol: 'SSH', key: 'jenkins_rsa' },
  { id: 'atai', name: 'atai (ssh - key)', protocol: 'SSH', key: 'id_ed25519_aws' },
];

function ConnectionPanel({ host, profiles = DEFAULT_PROFILES }) {
  if (!host) {
    return (
      <div style={{ ...panelStyles.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--consoleri-muted)' }} data-od-id="connection-panel-empty">
        Select a host to view connection profiles
      </div>
    );
  }

  const [localPart, domainPart] = (host.domain || '').split('.');
  const displayDomain = domainPart ? (
    <>{localPart}.<span style={panelStyles.accent}>{domainPart}</span></>
  ) : host.domain;

  return (
    <section style={panelStyles.panel} data-od-id="connection-panel">
      <div style={panelStyles.label}>Connect</div>
      <div style={panelStyles.hostName}>{host.name}</div>
      <div style={panelStyles.address}>{displayDomain}</div>

      <div style={panelStyles.sectionTitle}>Connection profiles</div>
      {profiles.map((profile) => (
        <div key={profile.id} style={panelStyles.profileRow} data-od-id={`profile-${profile.id}`}>
          <div>
            <strong>{profile.name}</strong>
            <span style={panelStyles.badge}>{profile.protocol}</span>
            <div style={panelStyles.keyFile}>{profile.key}</div>
          </div>
          <div style={panelStyles.actions}>
            <button type="button" style={panelStyles.iconBtn(true)} title="Run">▶</button>
            <button type="button" style={panelStyles.iconBtn(false)} title="Sync">⇄</button>
            <button type="button" style={panelStyles.iconBtn(false)} title="Edit">✎</button>
            <button type="button" style={{ ...panelStyles.iconBtn(false), color: 'var(--consoleri-danger)' }} title="Delete">✕</button>
          </div>
        </div>
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 'var(--consoleri-font-size-sm)', color: 'var(--consoleri-muted)' }}>
        <input type="checkbox" defaultChecked /> Open log on connect
        <span style={{ marginLeft: 'auto' }}>Log verbosity: Normal</span>
      </label>
    </section>
  );
}

window.ConnectionPanel = ConnectionPanel;
