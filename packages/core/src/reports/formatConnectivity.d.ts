import type { ConnectivityTestResult, Report, ReportFormatLabels } from './types';
export declare function formatConnectivityReportMarkdown(report: Report, result: ConnectivityTestResult, labels: ReportFormatLabels): string;
export declare function formatConnectivityReportText(report: Report, result: ConnectivityTestResult, labels: ReportFormatLabels): string;
export declare function summarizeConnectivityResult(result: ConnectivityTestResult): string;
