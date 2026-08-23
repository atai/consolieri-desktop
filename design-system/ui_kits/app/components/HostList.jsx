const hostListStyles = {
  container: { flex: 1, overflow: 'auto', minHeight: 0 },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'var(--consoleri-surface-muted)',
    borderBottom: '1px solid var(--consoleri-border)',
    fontSize: 'var(--consoleri-font-size-sm)',
    fontWeight: 700,
    color: 'var(--consoleri-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  row: (selected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderBottom: '1px solid var(--consoleri-border)',
    background: selected ? 'var(--consoleri-accent-muted)' : 'transparent',
    cursor: 'pointer',
    transition: `background var(--consoleri-duration-fast) var(--consoleri-ease-out)`,
  }),
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    flexShrink: 0,
  },
  name: { fontWeight: 600, fontSize: 'var(--consoleri-font-size-base)' },
  domain: { fontSize: 'var(--consoleri-font-size-sm)', color: 'var(--consoleri-muted)' },
  tag: {
    marginLeft: 'auto',
    fontFamily: 'var(--consoleri-font-mono)',
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 'var(--consoleri-radius-pill)',
    border: '1px solid var(--consoleri-border)',
    color: 'var(--consoleri-muted)',
    background: 'var(--consoleri-surface)',
  },
  count: { color: 'var(--consoleri-muted)', fontFamily: 'var(--consoleri-font-mono)', fontSize: 'var(--consoleri-font-size-sm)' },
};

const DEFAULT_GROUPS = [
  {
    tag: '#CUSTOM JENKINS AGENT',
    count: 1,
    hosts: [{ id: 'arcjenkins-test', name: 'arcjenkins-test', domain: 'arcjenkins-test.mycorp.internal', tag: 'jenkins' }],
  },
  {
    tag: '#GRAFANA',
    count: 1,
    hosts: [{ id: 'arc-grafana', name: 'arc-grafana', domain: 'arc-grafana.mycorp.internal', tag: 'grafana' }],
  },
  {
    tag: '#TEST INSTANCES',
    count: 2,
    hosts: [
      { id: 'de02arcdev4', name: 'de02arcdev4', domain: 'de02arcdev4.mycorp.internal', tag: 'dev' },
      { id: 'de02arcdev5', name: 'de02arcdev5', domain: 'de02arcdev5.mycorp.internal', tag: 'dev' },
    ],
  },
];

function HostList({ groups = DEFAULT_GROUPS, selectedHostId, onSelectHost }) {
  return (
    <div style={hostListStyles.container} data-od-id="hostlist">
      {groups.map((group) => (
        <section key={group.tag}>
          <div style={hostListStyles.groupHeader}>
            <span>{group.tag}</span>
            <span style={hostListStyles.count}>{group.count}</span>
          </div>
          {group.hosts.map((host) => (
            <div
              key={host.id}
              style={hostListStyles.row(host.id === selectedHostId)}
              onClick={() => onSelectHost?.(host)}
              data-od-id={`host-row-${host.id}`}
            >
              <div style={hostListStyles.avatar} aria-hidden="true" />
              <div>
                <div style={hostListStyles.name}>{host.name}</div>
                <div style={hostListStyles.domain}>{host.domain}</div>
              </div>
              <span style={hostListStyles.tag}>{host.tag}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

window.HostList = HostList;
