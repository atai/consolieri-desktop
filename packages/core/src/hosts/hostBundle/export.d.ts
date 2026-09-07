import type { ConnectionProfile, Host } from '../../types';
import type { GroupExportItem, HostExportItem, HostGroupLike, HostProfileLinkExport, HostsExportDocument, HostSessionPresetExport, ProfileExportItem } from './types';
export declare function sanitizeCredentialRefForExport(credentialRef: string | null): string | null;
export declare function hostToExportItem(host: Host, sessionPreset?: HostSessionPresetExport | null): HostExportItem;
export declare function profileToExportItem(profile: ConnectionProfile): ProfileExportItem;
export declare function groupToExportItem(group: HostGroupLike): GroupExportItem;
export declare function buildHostsExportDocument(groups: HostGroupLike[], hosts: Host[], profiles: ConnectionProfile[], links: HostProfileLinkExport[], exportedAt?: string, presetsByHostId?: ReadonlyMap<string, HostSessionPresetExport>): HostsExportDocument;
export declare function serializeHostsExportDocument(doc: HostsExportDocument): string;
