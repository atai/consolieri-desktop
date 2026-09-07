import { estimateTagClusters } from './clusterMetrics';
import { placeHosts } from './placeHosts';
import { placeTags } from './placeTags';
export function layoutLogicalGraph(graph, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const metrics = estimateTagClusters(graph);
    const tagPositions = placeTags(metrics, width, height);
    return placeHosts(graph, tagPositions, metrics, centerX, centerY);
}
