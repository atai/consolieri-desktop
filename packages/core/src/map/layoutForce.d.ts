import type { MapGraph } from './buildGraph';
import type { LogicalLayoutNode } from './logical/types';
export interface ForceLayoutNode extends LogicalLayoutNode {
}
/** @deprecated Use layoutLogicalGraph */
export declare function layoutForceGraph(graph: MapGraph, width: number, height: number): ForceLayoutNode[];
