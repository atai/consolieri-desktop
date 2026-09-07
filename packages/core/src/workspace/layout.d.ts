import type { MosaicNode } from '../types';
export declare function insertPaneIntoLayout<T extends string>(current: MosaicNode<T> | null, paneId: T, direction?: 'row' | 'column'): MosaicNode<T>;
export declare function removeFromLayout<T extends string>(node: MosaicNode<T>, paneId: T): MosaicNode<T> | null;
export declare function splitPaneInLayout<T extends string>(node: MosaicNode<T>, targetPaneId: T, newPaneId: T, direction: 'row' | 'column', splitPercentages?: number[]): MosaicNode<T> | null;
