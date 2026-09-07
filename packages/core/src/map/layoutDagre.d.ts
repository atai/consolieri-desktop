import type { MapGraph, MapGraphNode } from './buildGraph';
export interface DagreLayoutNode extends MapGraphNode {
    x: number;
    y: number;
}
export declare function layoutDagreGraph(graph: MapGraph): DagreLayoutNode[];
