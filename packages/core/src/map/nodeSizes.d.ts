import type { MapNodeKind } from './buildGraph';
export interface MapNodeSize {
    width: number;
    height: number;
}
export declare function getMapNodeSize(kind: MapNodeKind): MapNodeSize;
export declare function getMapNodeCollisionRadius(kind: MapNodeKind): number;
export declare function layoutCenterToTopLeft(centerX: number, centerY: number, kind: MapNodeKind): {
    x: number;
    y: number;
};
