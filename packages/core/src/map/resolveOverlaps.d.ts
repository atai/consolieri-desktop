export interface LayoutPoint {
    id: string;
    kind: string;
    x: number;
    y: number;
}
export declare function resolveOverlaps(nodes: LayoutPoint[], radiusFor: (node: LayoutPoint) => number, options?: {
    fixedKinds?: string[];
    maxIterations?: number;
}): void;
