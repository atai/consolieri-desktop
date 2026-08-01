const badgeStyles = {
  ok: {
    color: 'var(--consoleri-success)',
    fontWeight: 700,
    fontFamily: 'var(--consoleri-font-mono)',
    fontSize: 'var(--consoleri-font-size-sm)',
    letterSpacing: '0.02em',
  },
  fail: {
    color: 'var(--consoleri-danger)',
    fontWeight: 700,
    fontFamily: 'var(--consoleri-font-mono)',
    fontSize: 'var(--consoleri-font-size-sm)',
    letterSpacing: '0.02em',
  },
  protocol: {
    fontFamily: 'var(--consoleri-font-mono)',
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 'var(--consoleri-radius-pill)',
    background: 'var(--consoleri-surface-raised)',
    border: '1px solid var(--consoleri-border)',
    color: 'var(--consoleri-muted)',
    display: 'inline-block',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--consoleri-font-size-md)' },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    fontFamily: 'var(--consoleri-font-mono)',
    fontSize: 'var(--consoleri-font-size-sm)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--consoleri-muted)',
    borderBottom: '1px solid var(--consoleri-border)',
  },
  td: {
    padding: '8px 10px',
    borderBottom: '1px solid var(--consoleri-border)',
    color: 'var(--consoleri-fg)',
  },
  link: { color: 'var(--consoleri-accent)', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' },
};

const SAMPLE_ROWS = [
  { host: 'arcjenkins-test', profile: 'Relauto key auth', status: 'OK', duration: '3.2s' },
  { host: 'de02arcdev4', profile: 'atai (ssh - key)', status: 'OK', duration: '2.8s' },
  { host: 'de02arcdev5', profile: 'Relauto key auth', status: 'FAIL', duration: '30.0s' },
];

function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();
  const isOk = normalized === 'OK';
  return (
    <span style={isOk ? badgeStyles.ok : badgeStyles.fail} data-od-id={`status-${normalized.toLowerCase()}`}>
      {normalized}
    </span>
  );
}

function ReportTable({ rows = SAMPLE_ROWS }) {
  return (
    <table style={badgeStyles.table} data-od-id="report-table">
      <thead>
        <tr>
          <th style={badgeStyles.th}>Host</th>
          <th style={badgeStyles.th}>Profile</th>
          <th style={badgeStyles.th}>Status</th>
          <th style={badgeStyles.th}>Duration</th>
          <th style={badgeStyles.th}>Details</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.host}>
            <td style={badgeStyles.td}>{row.host}</td>
            <td style={badgeStyles.td}>{row.profile}</td>
            <td style={badgeStyles.td}><StatusBadge status={row.status} /></td>
            <td style={{ ...badgeStyles.td, fontFamily: 'var(--consoleri-font-mono)', fontVariantNumeric: 'tabular-nums' }}>{row.duration}</td>
            <td style={badgeStyles.td}><button type="button" style={badgeStyles.link}>Show</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

window.StatusBadge = StatusBadge;
window.ReportTable = ReportTable;
