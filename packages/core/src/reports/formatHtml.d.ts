import type { Report, ReportFormatLabels, ReportResult } from './types';
export { formatConnectivityReportHtml } from './formatConnectivityHtml';
export { formatCustomTestReportHtml } from './formatCustomTestHtml';
export { formatInventoryReportHtml } from './formatInventoryHtml';
export declare function formatReportHtml(report: Report, result: ReportResult, labels: ReportFormatLabels): string;
