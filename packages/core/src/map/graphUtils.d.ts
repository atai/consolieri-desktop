import type { MapGraph } from './buildGraph';
export declare function hostsPerTag(graph: MapGraph): Map<string, string[]>;
export declare function primaryTagForHost(hostNodeId: string, graph: MapGraph): string | null;
