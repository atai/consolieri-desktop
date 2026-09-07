import type { CustomTestResult, Report, ReportFormatLabels } from './types';
export declare function formatCustomTestReportMarkdown(report: Report, result: CustomTestResult, labels: ReportFormatLabels): string;
export declare function formatCustomTestReportText(report: Report, result: CustomTestResult, labels: ReportFormatLabels): string;
export declare function summarizeCustomTestResult(result: CustomTestResult): string;
