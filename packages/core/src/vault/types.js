export const DEFAULT_VAULT_SETTINGS = {
    enabled: false,
    address: '',
    namespace: '',
    defaultKvMount: 'secret',
    secretPathPrefix: 'consoleri',
    defaultBackend: 'local',
    auth: { method: 'token', hasToken: false },
    tlsSkipVerify: false
};
