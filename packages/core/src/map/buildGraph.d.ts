import type { Host } from '../types';
export type MapNodeKind = 'host' | 'tag' | 'gateway';
export type MapEdgeKind = 'membership' | 'related' | 'related-reverse' | 'gateway';
export interface MapGraphNode {
    id: string;
    kind: MapNodeKind;
    label: string;
    hostId?: string;
    tag?: string;
}
export interface MapGraphEdge {
    id: string;
    source: string;
    target: string;
    kind: MapEdgeKind;
}
export interface MapGraph {
    nodes: MapGraphNode[];
    edges: MapGraphEdge[];
}
export declare function buildLogicalGraph(hosts: Host[]): MapGraph;
export declare function buildNetworkGraph(hosts: Host[]): MapGraph;
