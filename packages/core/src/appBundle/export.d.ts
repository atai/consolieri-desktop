import type { AppSettings } from '../types';
import type { HostListViewSettings } from '../hosts/hostListView';
import type { MapViewSettings } from '../map/mapView';
import type { VaultSettings } from '../vault/types';
import type { UxProfile } from '../ux/types';
import type { HostsExportDocument } from '../hosts/hostBundle/types';
import type { Report } from '../reports/types';
import type { AppExportDocument, AppSettingsExport, ReportExportItem, SecretExportItem, WorkspaceExportItem, WorkspaceTabExport } from './types';
export declare function buildAppSettingsExport(app: AppSettings, hostListView: HostListViewSettings, mapView: MapViewSettings, vault: VaultSettings, activeUxProfileId: string | null, uxProfiles: UxProfile[]): AppSettingsExport;
export declare function reportToExportItem(report: Report): ReportExportItem;
export interface WorkspaceTabForExport {
    id: string;
    hostId: string | null;
    title: string;
    layout: unknown;
    panes: Array<{
        paneId: string;
        connectRequest: WorkspaceTabExport['panes'][number]['connectRequest'];
    }>;
}
export interface WorkspaceForExport {
    name: string;
    tabs: WorkspaceTabForExport[];
    activeTabId: string | null;
}
export declare function buildWorkspaceExportItem(workspace: WorkspaceForExport): WorkspaceExportItem;
export declare function buildAppExportDocument(settings: AppSettingsExport, secrets: SecretExportItem[], hosts: HostsExportDocument, reports: Report[], workspace: WorkspaceForExport | null, exportedAt?: string): AppExportDocument;
export declare function serializeAppExportDocument(doc: AppExportDocument): string;
