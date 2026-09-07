import type { MapGraph } from '../buildGraph';
import type { TagClusterMetrics } from './types';
export declare function orbitRadiusForHostCount(hostCount: number): number;
export declare function estimateTagClusters(graph: MapGraph): Map<string, TagClusterMetrics>;
