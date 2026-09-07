import type { TagClusterMetrics } from './types';
export declare function placeTags(metrics: Map<string, TagClusterMetrics>, width: number, height: number): Map<string, {
    x: number;
    y: number;
}>;
