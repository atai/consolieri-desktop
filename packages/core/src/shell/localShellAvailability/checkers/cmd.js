import { which } from '../which';
export function isCmdAvailable(deps) {
    if (deps.platform !== 'win32')
        return false;
    return (which({
        command: 'cmd.exe',
        platform: deps.platform,
        pathEnv: deps.pathEnv,
        existsSync: deps.existsSync,
        pathext: deps.pathext
    }) !== null);
}
