import type { InventoryResult, Report, ReportFormatLabels } from './types';
export declare function formatInventoryReportMarkdown(report: Report, result: InventoryResult, labels: ReportFormatLabels): string;
export declare function formatInventoryReportText(report: Report, result: InventoryResult, labels: ReportFormatLabels): string;
export declare function summarizeInventoryResult(result: InventoryResult): string;
