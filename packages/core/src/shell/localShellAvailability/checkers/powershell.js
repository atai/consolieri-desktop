import { which } from '../which';
export function isPowerShellAvailable(deps) {
    if (deps.platform !== 'win32')
        return false;
    return (which({
        command: 'powershell.exe',
        platform: deps.platform,
        pathEnv: deps.pathEnv,
        existsSync: deps.existsSync,
        pathext: deps.pathext
    }) !== null);
}
