import type { ReportHostEntry, ReportHostResultBase, ReportHostStatus } from './types';
export declare function isNonEmptyString(value: unknown): value is string;
export declare function normalizeHostEntry(raw: unknown): ReportHostEntry | null;
export declare function normalizeHostStatus(value: unknown): ReportHostStatus;
export declare function normalizeHostResultBase(raw: unknown): ReportHostResultBase | null;
export declare function normalizeHostEntries(raw: unknown): ReportHostEntry[];
