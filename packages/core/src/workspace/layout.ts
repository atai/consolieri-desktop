import type { MosaicNode, MosaicSplitNode, MosaicTabsNode } from '../types'

/** Split lines this close to the closed pane's edge, in percentage points, count as that edge. */
const ROW_BAND_TOLERANCE_PERCENT = 1

type SplitDirection = 'row' | 'column'

interface WeightedNode<T extends string> {
  node: MosaicNode<T>
  /** Share of the parent split, in percent. */
  size: number
}

interface LeafPathStep<T extends string> {
  node: MosaicSplitNode<T> | MosaicTabsNode<T>
  index: number
}

interface ColumnBands<T extends string> {
  above: MosaicNode<T> | null
  mid: MosaicNode<T> | null
  below: MosaicNode<T> | null
}

export function insertPaneIntoLayout<T extends string>(
  current: MosaicNode<T> | null,
  paneId: T,
  direction: SplitDirection = 'row'
): MosaicNode<T> {
  if (!current) return paneId
  if (typeof current === 'string') {
    return { type: 'split', direction, children: [current, paneId] }
  }
  if (current.type === 'tabs') {
    return { type: 'split', direction, children: [current, paneId] }
  }
  return { type: 'split', direction, children: [current, paneId] }
}

export function removeFromLayout<T extends string>(
  node: MosaicNode<T>,
  paneId: T
): MosaicNode<T> | null {
  return removeLeaf(alignRowForRemoval(node, paneId), paneId)
}

export function splitPaneInLayout<T extends string>(
  node: MosaicNode<T>,
  targetPaneId: T,
  newPaneId: T,
  direction: SplitDirection,
  splitPercentages: number[] = [50, 50]
): MosaicNode<T> | null {
  if (typeof node === 'string') {
    if (node !== targetPaneId) return node
    return {
      type: 'split',
      direction,
      children: [targetPaneId, newPaneId],
      splitPercentages
    }
  }
  if (node.type === 'tabs') {
    return node
  }
  const split = node as MosaicSplitNode<T>
  const children = split.children.map((child) =>
    splitPaneInLayout(child, targetPaneId, newPaneId, direction, splitPercentages)
  )
  const changed = children.some((child, i) => child !== split.children[i])
  if (!changed) return node
  return { ...split, children: children as MosaicNode<T>[] }
}

function isSplit<T extends string>(node: MosaicNode<T>): node is MosaicSplitNode<T> {
  return typeof node !== 'string' && node.type === 'split'
}

/** Absent percentages mean equal shares, matching react-mosaic. */
function childSizes<T extends string>(split: MosaicSplitNode<T>): number[] {
  const count = split.children.length
  const raw = split.splitPercentages
  if (!raw) return Array.from({ length: count }, () => 100 / count)
  if (raw.length !== count) {
    throw new Error(`splitPercentages length ${raw.length} does not match ${count} children`)
  }
  const total = raw.reduce((sum, size) => sum + size, 0)
  if (total <= 0) {
    throw new Error('splitPercentages must sum to a positive value')
  }
  return raw.map((size) => (size / total) * 100)
}

function flattenSplit<T extends string>(
  node: MosaicNode<T>,
  direction: SplitDirection
): WeightedNode<T>[] {
  if (!isSplit(node) || node.direction !== direction) {
    return [{ node, size: 100 }]
  }
  const sizes = childSizes(node)
  const flat: WeightedNode<T>[] = []
  node.children.forEach((child, index) => {
    for (const entry of flattenSplit(child, direction)) {
      flat.push({ node: entry.node, size: (sizes[index] * entry.size) / 100 })
    }
  })
  return flat
}

function buildSplit<T extends string>(
  direction: SplitDirection,
  entries: WeightedNode<T>[]
): MosaicNode<T> {
  if (entries.length === 0) {
    throw new Error('Cannot build a split with no children')
  }
  if (entries.length === 1) return entries[0].node
  const total = entries.reduce((sum, entry) => sum + entry.size, 0)
  if (total <= 0) {
    throw new Error('Split sizes must sum to a positive value')
  }
  return {
    type: 'split',
    direction,
    children: entries.map((entry) => entry.node),
    splitPercentages: entries.map((entry) => (entry.size / total) * 100)
  }
}

/** Cumulative edges of a flattened split, starting at 0 and ending at the total. */
function boundaries<T extends string>(entries: WeightedNode<T>[]): number[] {
  const points = [0]
  let cursor = 0
  for (const entry of entries) {
    cursor += entry.size
    points.push(cursor)
  }
  return points
}

function snapBoundaryIndex(points: number[], target: number): number | null {
  let bestIndex: number | null = null
  let bestDistance = ROW_BAND_TOLERANCE_PERCENT
  for (let index = 0; index < points.length; index++) {
    const distance = Math.abs(points[index] - target)
    if (distance <= bestDistance) {
      bestIndex = index
      bestDistance = distance
    }
  }
  return bestIndex
}

function packEntries<T extends string>(
  direction: SplitDirection,
  entries: WeightedNode<T>[]
): MosaicNode<T> | null {
  if (entries.length === 0) return null
  return buildSplit(direction, entries)
}

/**
 * Partition a column on the closed pane's top and bottom edges.
 * Returns null when this column does not share both edges.
 */
function columnBands<T extends string>(
  node: MosaicNode<T>,
  top: number,
  bottom: number
): ColumnBands<T> | null {
  if (!isSplit(node) || node.direction !== 'column') return null
  const flat = flattenSplit(node, 'column')
  const points = boundaries(flat)
  const topIndex = snapBoundaryIndex(points, top)
  const bottomIndex = snapBoundaryIndex(points, bottom)
  if (topIndex === null || bottomIndex === null || bottomIndex <= topIndex) return null

  const above = flat.slice(0, topIndex)
  const mid = flat.slice(topIndex, bottomIndex)
  const below = flat.slice(bottomIndex)
  return {
    above: packEntries('column', above),
    mid: packEntries('column', mid),
    below: packEntries('column', below)
  }
}

function findLeafPath<T extends string>(
  node: MosaicNode<T>,
  paneId: T
): LeafPathStep<T>[] | null {
  if (typeof node === 'string') return node === paneId ? [] : null
  if (node.type === 'tabs') {
    const index = node.tabs.indexOf(paneId)
    return index >= 0 ? [{ node, index }] : null
  }
  for (let index = 0; index < node.children.length; index++) {
    const childPath = findLeafPath(node.children[index], paneId)
    if (childPath) return [{ node, index }, ...childPath]
  }
  return null
}

function replaceAtPath<T extends string>(
  node: MosaicNode<T>,
  path: number[],
  replacement: MosaicNode<T>
): MosaicNode<T> {
  if (path.length === 0) return replacement
  if (!isSplit(node)) return node
  const [index, ...rest] = path
  return {
    ...node,
    children: node.children.map((child, childIndex) =>
      childIndex === index ? replaceAtPath(child, rest, replacement) : child
    )
  }
}

function bandRow<T extends string>(
  pieces: Array<MosaicNode<T> | null>,
  widths: number[]
): MosaicNode<T> | null {
  const entries: WeightedNode<T>[] = []
  pieces.forEach((piece, index) => {
    if (piece !== null) entries.push({ node: piece, size: widths[index] })
  })
  return packEntries('row', entries)
}

function uniformBand<T extends string>(
  bands: ColumnBands<T>[],
  key: 'above' | 'below'
): boolean {
  const present = bands.filter((band) => band[key] !== null).length
  return present === 0 || present === bands.length
}

/**
 * When the closed pane is stacked in a column, rewrite the surrounding row so
 * panes sharing its top and bottom edges become siblings in that row. Geometry
 * stays the same; the following removal then grows those siblings. The original
 * tree is returned when the pane already shares a row with its neighbors, or
 * when no aligned neighbor exists.
 */
function alignRowForRemoval<T extends string>(node: MosaicNode<T>, paneId: T): MosaicNode<T> {
  const path = findLeafPath(node, paneId)
  if (!path || path.length === 0) return node

  const parent = path[path.length - 1].node
  if (!isSplit(parent) || parent.direction !== 'column') return node

  let columnTop = path.length - 1
  while (columnTop > 0) {
    const upper = path[columnTop - 1].node
    if (!isSplit(upper) || upper.direction !== 'column') break
    columnTop--
  }

  let rowTop = columnTop
  while (rowTop > 0) {
    const upper = path[rowTop - 1].node
    if (!isSplit(upper) || upper.direction !== 'row') break
    rowTop--
  }
  if (rowTop === columnTop) return node

  const columnSplit = path[columnTop].node
  const rowSplit = path[rowTop].node
  if (!isSplit(columnSplit) || !isSplit(rowSplit)) return node

  const rowEntries = flattenSplit(rowSplit, 'row')
  const columnIndex = rowEntries.findIndex((entry) => entry.node === columnSplit)
  if (columnIndex < 0) return node

  const columnEntries = flattenSplit(columnSplit, 'column')
  const leafIndex = columnEntries.findIndex((entry) => entry.node === paneId)
  if (leafIndex < 0) return node

  let top = 0
  for (let index = 0; index < leafIndex; index++) top += columnEntries[index].size
  const bottom = top + columnEntries[leafIndex].size

  let start = columnIndex
  let end = columnIndex
  while (start > 0 && columnBands(rowEntries[start - 1].node, top, bottom)) start--
  while (end < rowEntries.length - 1 && columnBands(rowEntries[end + 1].node, top, bottom)) end++
  if (start === end) return node

  const segment = rowEntries.slice(start, end + 1)
  const bands = segment.map((entry) => columnBands(entry.node, top, bottom))
  if (!bands.every((band): band is ColumnBands<T> => band !== null)) return node
  const present = bands
  if (!uniformBand(present, 'above') || !uniformBand(present, 'below')) return node

  const widths = segment.map((entry) => entry.size)
  const stacked: WeightedNode<T>[] = []
  const above = bandRow(
    present.map((band) => band.above),
    widths
  )
  const mid = bandRow(
    present.map((band) => band.mid),
    widths
  )
  const below = bandRow(
    present.map((band) => band.below),
    widths
  )
  if (above && top > 0) stacked.push({ node: above, size: top })
  if (mid && bottom > top) stacked.push({ node: mid, size: bottom - top })
  if (below && bottom < 100) stacked.push({ node: below, size: 100 - bottom })
  if (!mid || stacked.length === 0) return node

  const transposed = buildSplit('column', stacked)
  const nextRow = buildSplit('row', [
    ...rowEntries.slice(0, start),
    { node: transposed, size: widths.reduce((sum, width) => sum + width, 0) },
    ...rowEntries.slice(end + 1)
  ])
  const pathToRow = path.slice(0, rowTop).map((step) => step.index)
  return replaceAtPath(node, pathToRow, nextRow)
}

function removeLeaf<T extends string>(node: MosaicNode<T>, paneId: T): MosaicNode<T> | null {
  if (typeof node === 'string') return node === paneId ? null : node
  if (node.type === 'tabs') {
    const tabs = node.tabs.filter((tab) => tab !== paneId)
    if (tabs.length === 0) return null
    if (tabs.length === 1) return tabs[0]
    const activeTab = tabs.includes(node.activeTab) ? node.activeTab : tabs[0]
    return { type: 'tabs', tabs, activeTab }
  }

  const sizes = childSizes(node)
  const next: WeightedNode<T>[] = []
  let removed = 0
  let nestedChange = false
  for (let index = 0; index < node.children.length; index++) {
    const child = removeLeaf(node.children[index], paneId)
    if (child === null) {
      removed++
      continue
    }
    if (child !== node.children[index]) nestedChange = true
    next.push({ node: child, size: sizes[index] })
  }
  if (removed === 0 && !nestedChange) return node
  if (next.length === 0) return null
  if (removed === 0) return { ...node, children: next.map((entry) => entry.node) }
  return buildSplit(node.direction, next)
}
