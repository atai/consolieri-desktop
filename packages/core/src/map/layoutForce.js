import { layoutLogicalGraph } from './logical/layoutLogicalGraph';
/** @deprecated Use layoutLogicalGraph */
export function layoutForceGraph(graph, width, height) {
    return layoutLogicalGraph(graph, width, height);
}
