import { which } from '../which';
export function isPwshAvailable(deps) {
    return (which({
        command: deps.platform === 'win32' ? 'pwsh.exe' : 'pwsh',
        platform: deps.platform,
        pathEnv: deps.pathEnv,
        existsSync: deps.existsSync,
        pathext: deps.pathext
    }) !== null);
}
