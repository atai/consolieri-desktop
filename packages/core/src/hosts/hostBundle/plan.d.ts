import type { GroupCreateFromExport, GroupExportItem, HostCreateFromExport, HostExportItem, HostProfileLinkExport, HostRelationPatchFromExport, ProfileCreateFromExport, ProfileExportItem } from './types';
export declare function remapExportId(exportId: string | null | undefined, idMap: ReadonlyMap<string, string>): string | null;
export declare function remapExportIds(exportIds: readonly string[], idMap: ReadonlyMap<string, string>): string[];
export declare function resolveUxProfileIdForImport(uxProfileId: string | null, validUxProfileIds: ReadonlySet<string>): string | null;
export declare function groupCreateFromExportItem(group: GroupExportItem, groupIdMap: ReadonlyMap<string, string>): GroupCreateFromExport;
export declare function hostCreateFromExportItem(host: HostExportItem, groupIdMap: ReadonlyMap<string, string>, validUxProfileIds: ReadonlySet<string>): HostCreateFromExport;
export declare function hostRelationPatchFromExportItem(host: HostExportItem, hostIdMap: ReadonlyMap<string, string>, profileIdMap: ReadonlyMap<string, string>): HostRelationPatchFromExport | null;
export declare function profileCreateFromExportItem(profile: ProfileExportItem, hostIdMap: ReadonlyMap<string, string>): ProfileCreateFromExport;
export declare function resolveHostProfileLink(link: HostProfileLinkExport, hostIdMap: ReadonlyMap<string, string>, profileIdMap: ReadonlyMap<string, string>): {
    hostId: string;
    profileId: string;
} | null;
