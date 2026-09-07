export type HostLogVerbosity = 'quiet' | 'info' | 'verbose' | 'trace';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare const HOST_LOG_VERBOSITY_OPTIONS: Array<{
    value: HostLogVerbosity;
    label: string;
    description: string;
}>;
export declare function normalizeHostLogVerbosity(value: unknown): HostLogVerbosity;
export declare function shouldIncludeLogEntry(verbosity: HostLogVerbosity, level: LogLevel, meta?: Record<string, unknown>): boolean;
export declare function sshDebugEnabled(verbosity: HostLogVerbosity): boolean;
export declare function maxLogEntriesForVerbosity(verbosity: HostLogVerbosity): number;
