export declare const DEFAULT_COMMAND_HISTORY_LIMIT = 200;
export declare const MAX_COMMAND_HISTORY_LIMIT = 2000;
export declare function clampCommandHistoryLimit(value: unknown): number;
export declare function tailShellHistory(content: string, limit: number): string[];
export declare function shellHistorySeed(lines: readonly string[] | undefined): string;
