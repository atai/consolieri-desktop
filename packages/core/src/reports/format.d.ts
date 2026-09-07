import type { Report, ReportFormatLabels, ReportResult } from './types';
export { formatDuration, formatBytes, statusLabel, formatRunTimestamp, totalReportDurationMs } from './formatCommon';
export { formatConnectivityReportMarkdown, formatConnectivityReportText, summarizeConnectivityResult } from './formatConnectivity';
export { formatCustomTestReportMarkdown, formatCustomTestReportText, summarizeCustomTestResult } from './formatCustomTest';
export { formatInventoryReportMarkdown, formatInventoryReportText, summarizeInventoryResult } from './formatInventory';
export { formatConnectivityReportHtml, formatCustomTestReportHtml, formatInventoryReportHtml, formatReportHtml } from './formatHtml';
export declare function formatReportMarkdown(report: Report, result: ReportResult, labels: ReportFormatLabels): string;
export declare function formatReportText(report: Report, result: ReportResult, labels: ReportFormatLabels): string;
export declare function summarizeReportResult(result: ReportResult): string;
