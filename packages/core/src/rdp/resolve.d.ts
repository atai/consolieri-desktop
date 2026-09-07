export interface DesktopSize {
    width: number;
    height: number;
}
export interface RdpSizeMinimums {
    width: number;
    height: number;
}
export declare function resolveRdpPort(extra?: Record<string, unknown> | null, fallback?: number): number;
export declare function buildRdpDestination(hostname: string, port: number): string;
export declare function normalizeDesktopSize(width: number, height: number, minimums?: RdpSizeMinimums): DesktopSize;
export declare function destinationsMatch(requested: string, allowedHost: string, allowedPort: number): boolean;
export declare function assertAllowedDestination(requested: string, allowedHost: string, allowedPort: number): void;
