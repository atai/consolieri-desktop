function isPathLike(command) {
    return command.includes('/') || command.includes('\\');
}
function splitPathEnv(platform, pathEnv) {
    if (!pathEnv)
        return [];
    const delimiter = platform === 'win32' ? ';' : ':';
    return pathEnv.split(delimiter).map((d) => d.trim()).filter(Boolean);
}
function defaultPathext() {
    // Minimal set: enough for shell detection and keeps behaviour predictable.
    return ['.EXE', '.BAT', '.CMD', '.COM', '.PS1'];
}
/** Basename extname for Windows (matches node:path.win32.extname for shell names). */
function winExtname(command) {
    const base = command.replace(/^.*[/\\]/, '');
    const i = base.lastIndexOf('.');
    return i > 0 ? base.slice(i) : '';
}
function joinPath(isWin, dir, file) {
    if (isWin) {
        return `${dir.replace(/[/\\]+$/, '')}\\${file}`;
    }
    return `${dir.replace(/\/+$/, '')}/${file}`;
}
export function which({ command, platform, pathEnv, existsSync, pathext }) {
    if (isPathLike(command)) {
        return existsSync(command) ? command : null;
    }
    const dirs = splitPathEnv(platform, pathEnv);
    if (dirs.length === 0)
        return null;
    const isWin = platform === 'win32';
    const pathextList = (pathext ?? defaultPathext()).filter(Boolean);
    const ext = isWin ? winExtname(command) : '';
    const candidates = isWin && ext === '' ? pathextList.map((e) => `${command}${e}`) : [command];
    for (const dir of dirs) {
        for (const c of candidates) {
            const full = joinPath(isWin, dir, c);
            if (existsSync(full))
                return full;
        }
    }
    return null;
}
