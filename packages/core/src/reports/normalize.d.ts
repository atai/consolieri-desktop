import type { ReportConfig, ReportResult, ReportType } from './types';
export { normalizeConnectivityTestConfig, normalizeConnectivityTestResult } from './normalizeConnectivity';
export { normalizeCustomTestConfig, normalizeCustomTestResult } from './normalizeCustomTest';
export { normalizeInventoryConfig, normalizeInventoryResult } from './normalizeInventory';
export { isNonEmptyString, normalizeHostEntry, normalizeHostEntries } from './normalizeCommon';
export declare function normalizeReportConfig(type: ReportType, input: unknown): ReportConfig;
export declare function normalizeReportResult(type: ReportType, input: unknown): ReportResult | null;
