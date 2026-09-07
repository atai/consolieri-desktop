import type { MapGraph } from '../buildGraph';
import type { LogicalLayoutNode, TagClusterMetrics } from './types';
export declare function placeHosts(graph: MapGraph, tagPositions: Map<string, {
    x: number;
    y: number;
}>, metrics: Map<string, TagClusterMetrics>, centerX: number, centerY: number): LogicalLayoutNode[];
