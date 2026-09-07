const LEVEL_RANK = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};
const MIN_LEVEL = {
    quiet: 'warn',
    info: 'info',
    verbose: 'debug',
    trace: 'debug'
};
export const HOST_LOG_VERBOSITY_OPTIONS = [
    { value: 'quiet', label: 'Quiet', description: 'Warnings and errors only' },
    { value: 'info', label: 'Normal', description: 'Standard connection messages' },
    { value: 'verbose', label: 'Verbose', description: 'Detailed connection steps' },
    { value: 'trace', label: 'Trace (ssh -vvv)', description: 'Full SSH wire-level debug output' }
];
export function normalizeHostLogVerbosity(value) {
    if (value === 'quiet' || value === 'info' || value === 'verbose' || value === 'trace') {
        return value;
    }
    return 'info';
}
export function shouldIncludeLogEntry(verbosity, level, meta) {
    const minLevel = MIN_LEVEL[verbosity];
    if (LEVEL_RANK[level] > LEVEL_RANK[minLevel])
        return false;
    if (level === 'debug' && meta?.source === 'ssh2' && verbosity !== 'trace')
        return false;
    return true;
}
export function sshDebugEnabled(verbosity) {
    return verbosity === 'trace';
}
export function maxLogEntriesForVerbosity(verbosity) {
    return verbosity === 'trace' ? 5000 : 500;
}
