import { APP_BUNDLE_KIND, APP_BUNDLE_VERSION } from './types';
export function buildAppSettingsExport(app, hostListView, mapView, vault, activeUxProfileId, uxProfiles) {
    return { app, hostListView, mapView, vault, activeUxProfileId, uxProfiles };
}
export function reportToExportItem(report) {
    return {
        exportId: report.id,
        name: report.name,
        type: report.type,
        config: report.config,
        lastRunAt: report.lastRunAt,
        lastResult: report.lastResult,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
    };
}
export function buildWorkspaceExportItem(workspace) {
    const panes = workspace.panes.map((p) => ({
        paneId: p.paneId,
        connectRequest: { ...p.connectRequest }
    }));
    return { name: workspace.name, layout: workspace.layout, panes };
}
export function buildAppExportDocument(settings, secrets, hosts, reports, workspace, exportedAt = new Date().toISOString()) {
    return {
        kind: APP_BUNDLE_KIND,
        version: APP_BUNDLE_VERSION,
        exportedAt,
        settings,
        secrets,
        hosts,
        reports: reports.map(reportToExportItem),
        workspace: workspace ? buildWorkspaceExportItem(workspace) : null
    };
}
export function serializeAppExportDocument(doc) {
    return `${JSON.stringify(doc, null, 2)}\n`;
}
