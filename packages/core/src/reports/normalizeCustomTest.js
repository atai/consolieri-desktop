import { isNonEmptyString, normalizeHostEntries, normalizeHostResultBase, normalizeHostStatus } from './normalizeCommon';
export function normalizeCustomTestCommand(raw) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const entry = raw;
    if (!isNonEmptyString(entry.command))
        return null;
    return { command: entry.command.trim() };
}
export function normalizeCustomTestCommands(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.map(normalizeCustomTestCommand).filter((c) => c !== null);
}
export function normalizeCustomTestConfig(input) {
    if (typeof input !== 'object' || input === null) {
        return { type: 'custom_test', entries: [], commands: [], continueOnError: false };
    }
    const raw = input;
    return {
        type: 'custom_test',
        entries: normalizeHostEntries(raw.entries),
        commands: normalizeCustomTestCommands(raw.commands),
        continueOnError: raw.continueOnError === true
    };
}
function normalizeCustomTestCommandResult(raw) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const entry = raw;
    if (typeof entry.index !== 'number' || entry.index < 0)
        return null;
    if (!isNonEmptyString(entry.command))
        return null;
    const status = normalizeHostStatus(entry.status);
    const durationMs = typeof entry.durationMs === 'number' && entry.durationMs >= 0 ? entry.durationMs : 0;
    const code = entry.code === null
        ? null
        : typeof entry.code === 'number' && entry.code >= 0
            ? entry.code
            : null;
    const result = {
        index: entry.index,
        command: entry.command,
        status,
        code,
        stdout: typeof entry.stdout === 'string' ? entry.stdout : '',
        stderr: typeof entry.stderr === 'string' ? entry.stderr : '',
        durationMs
    };
    if (isNonEmptyString(entry.error))
        result.error = entry.error;
    return result;
}
function normalizeCustomTestHostResult(raw) {
    const base = normalizeHostResultBase(raw);
    if (!base)
        return null;
    const result = { ...base, commands: [] };
    if (typeof raw === 'object' && raw !== null) {
        const entry = raw;
        if (Array.isArray(entry.commands)) {
            result.commands = entry.commands
                .map(normalizeCustomTestCommandResult)
                .filter((c) => c !== null);
        }
    }
    return result;
}
export function normalizeCustomTestResult(input) {
    if (typeof input !== 'object' || input === null)
        return null;
    const raw = input;
    if (!isNonEmptyString(raw.runAt))
        return null;
    const entries = Array.isArray(raw.entries)
        ? raw.entries
            .map(normalizeCustomTestHostResult)
            .filter((e) => e !== null)
        : [];
    return { type: 'custom_test', runAt: raw.runAt, entries };
}
