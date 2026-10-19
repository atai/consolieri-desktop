import { migrateWorkspaceState } from '../workspace/migrate.js';
import { APP_BUNDLE_KIND } from './types';
function isRecord(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function normalizeReportExportItem(raw) {
    if (!isRecord(raw))
        return null;
    const exportId = typeof raw.exportId === 'string' ? raw.exportId : null;
    const name = typeof raw.name === 'string' ? raw.name : '';
    const type = raw.type;
    if (type !== 'connectivity_test' &&
        type !== 'inventory' &&
        type !== 'custom_test')
        return null;
    if (!exportId)
        return null;
    return {
        exportId,
        name,
        type,
        config: isRecord(raw.config)
            ? raw.config
            : { type },
        lastRunAt: typeof raw.lastRunAt === 'string' ? raw.lastRunAt : null,
        lastResult: isRecord(raw.lastResult)
            ? raw.lastResult
            : null,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString()
    };
}
function normalizePaneBinding(raw) {
    if (!isRecord(raw))
        return null;
    if (typeof raw.paneId !== 'string')
        return null;
    const connectRequest = isRecord(raw.connectRequest) ? raw.connectRequest : {};
    return { paneId: raw.paneId, connectRequest };
}
function normalizeWorkspaceExportItem(raw) {
    if (!isRecord(raw))
        return null;
    const name = typeof raw.name === 'string' ? raw.name : 'Default';
    let sequence = 0;
    const migrated = migrateWorkspaceState(raw, () => `imported-tab-${++sequence}`);
    return {
        name,
        activeTabId: migrated.activeTabId,
        tabs: migrated.tabs.map((tab) => ({
            id: tab.id,
            hostId: tab.hostId,
            title: tab.title,
            layout: tab.layout,
            panes: tab.panes.map(normalizePaneBinding).filter((pane) => pane !== null)
        }))
    };
}
export function isAppExportDocument(input) {
    if (!isRecord(input))
        return false;
    return input.kind === APP_BUNDLE_KIND && input.version === 1;
}
export function parseAppImportJson(json) {
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch {
        throw new Error('Invalid JSON');
    }
    return normalizeAppExportDocument(parsed);
}
export function normalizeAppExportDocument(input) {
    if (!isRecord(input)) {
        throw new Error('Not a valid app export document');
    }
    if (input.kind !== APP_BUNDLE_KIND) {
        throw new Error(`Expected kind "${APP_BUNDLE_KIND}", got "${String(input.kind)}"`);
    }
    if (input.version !== 1) {
        throw new Error(`Unsupported app bundle version: ${String(input.version)}`);
    }
    const settings = isRecord(input.settings) ? input.settings : {};
    const hosts = isRecord(input.hosts) ? input.hosts : {};
    const secrets = Array.isArray(input.secrets)
        ? input.secrets.filter((s) => isRecord(s) && typeof s.ref === 'string' && typeof s.encryptedBlob === 'string')
        : [];
    const reports = Array.isArray(input.reports)
        ? input.reports.map(normalizeReportExportItem).filter((r) => r !== null)
        : [];
    const workspace = input.workspace ? normalizeWorkspaceExportItem(input.workspace) : null;
    return {
        kind: APP_BUNDLE_KIND,
        version: 1,
        exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : new Date().toISOString(),
        settings: settings,
        secrets,
        hosts: hosts,
        reports,
        workspace
    };
}
