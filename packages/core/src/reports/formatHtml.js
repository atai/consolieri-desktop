import { formatConnectivityReportHtml } from './formatConnectivityHtml';
import { formatCustomTestReportHtml } from './formatCustomTestHtml';
import { formatInventoryReportHtml } from './formatInventoryHtml';
export { formatConnectivityReportHtml } from './formatConnectivityHtml';
export { formatCustomTestReportHtml } from './formatCustomTestHtml';
export { formatInventoryReportHtml } from './formatInventoryHtml';
export function formatReportHtml(report, result, labels) {
    switch (result.type) {
        case 'connectivity_test':
            return formatConnectivityReportHtml(report, result, labels);
        case 'inventory':
            return formatInventoryReportHtml(report, result, labels);
        case 'custom_test':
            return formatCustomTestReportHtml(report, result, labels);
        default:
            return formatConnectivityReportHtml(report, result, labels);
    }
}
