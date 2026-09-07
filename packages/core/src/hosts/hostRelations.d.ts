export declare function normalizeRelatedHostIds(hostId: string, relatedHostIds: string[] | undefined, existingHostIds: Set<string>): string[];
export declare function normalizeGatewayHostId(hostId: string, gatewayHostId: string | null | undefined, existingHosts: Array<{
    id: string;
    gatewayHostId: string | null;
}>): string | null;
