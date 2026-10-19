import { describe, expect, it } from 'vitest'
import type { MosaicNode } from '../types'
import { insertPaneIntoLayout, removeFromLayout, splitPaneInLayout } from './layout'

describe('insertPaneIntoLayout', () => {
  it('creates first pane', () => {
    expect(insertPaneIntoLayout(null, 'a')).toBe('a')
  })

  it('creates binary split from single pane', () => {
    expect(insertPaneIntoLayout('a', 'b')).toEqual({
      type: 'split',
      direction: 'row',
      children: ['a', 'b']
    })
  })

  it('nests third pane as new split (binary tree)', () => {
    const two: MosaicNode = { type: 'split', direction: 'row', children: ['a', 'b'] }
    const result = insertPaneIntoLayout(two, 'c')
    expect(result).toEqual({
      type: 'split',
      direction: 'row',
      children: [{ type: 'split', direction: 'row', children: ['a', 'b'] }, 'c']
    })
  })
})

describe('splitPaneInLayout', () => {
  it('splits a single leaf into row split', () => {
    expect(splitPaneInLayout('a', 'a', 'b', 'row')).toEqual({
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
      splitPercentages: [50, 50]
    })
  })

  it('splits a single leaf into column split', () => {
    expect(splitPaneInLayout('a', 'a', 'b', 'column', [40, 60])).toEqual({
      type: 'split',
      direction: 'column',
      children: ['a', 'b'],
      splitPercentages: [40, 60]
    })
  })

  it('returns leaf unchanged when target not found', () => {
    expect(splitPaneInLayout('a', 'b', 'c', 'row')).toBe('a')
  })

  it('splits target inside nested tree', () => {
    const tree = {
      type: 'split' as const,
      direction: 'row' as const,
      children: ['a', { type: 'split' as const, direction: 'column' as const, children: ['b', 'c'] }]
    }
    expect(splitPaneInLayout(tree, 'b', 'd', 'row')).toEqual({
      type: 'split',
      direction: 'row',
      children: [
        'a',
        {
          type: 'split',
          direction: 'column',
          children: [
            { type: 'split', direction: 'row', children: ['b', 'd'], splitPercentages: [50, 50] },
            'c'
          ]
        }
      ]
    })
  })
})

describe('removeFromLayout', () => {
  it('removes leaf', () => {
    expect(removeFromLayout('a', 'a')).toBeNull()
    expect(removeFromLayout('a', 'b')).toBe('a')
  })

  it('collapses single child after removal', () => {
    const tree = { type: 'split' as const, direction: 'row' as const, children: ['a', 'b'] as const }
    expect(removeFromLayout(tree, 'b')).toBe('a')
  })

  it('removes from nested split', () => {
    const tree = {
      type: 'split' as const,
      direction: 'row' as const,
      children: [{ type: 'split' as const, direction: 'row' as const, children: ['a', 'b'] }, 'c']
    }
    expect(removeFromLayout(tree, 'c')).toEqual({
      type: 'split',
      direction: 'row',
      children: ['a', 'b']
    })
  })

  it('drops a closed tab and collapses the last one', () => {
    expect(
      removeFromLayout({ type: 'tabs', tabs: ['a', 'b', 'c'], activeTab: 'c' }, 'a')
    ).toEqual({ type: 'tabs', tabs: ['b', 'c'], activeTab: 'c' })
    expect(
      removeFromLayout({ type: 'tabs', tabs: ['a', 'b', 'c'], activeTab: 'b' }, 'b')
    ).toEqual({ type: 'tabs', tabs: ['a', 'c'], activeTab: 'a' })
    expect(removeFromLayout({ type: 'tabs', tabs: ['a', 'b'], activeTab: 'b' }, 'b')).toBe('a')
    expect(removeFromLayout({ type: 'tabs', tabs: ['a'], activeTab: 'a' }, 'a')).toBeNull()
  })

  it('renormalizes an n-ary split when a direct child is removed', () => {
    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      splitPercentages: [50, 30, 20],
      children: ['a', 'b', 'c']
    }
    expectLayout(removeFromLayout(tree, 'b'), {
      type: 'split',
      direction: 'row',
      splitPercentages: [(50 / 70) * 100, (20 / 70) * 100],
      children: ['a', 'c']
    })
  })
})

describe('removeFromLayout row priority', () => {
  it('gives a closed bottom pane to its row in a split-right then split-down grid', () => {
    const tree = gridFromSplits([
      ['a', 'b', 'row'],
      ['b', 'c', 'row'],
      ['a', 'd', 'column'],
      ['b', 'e', 'column'],
      ['c', 'f', 'column']
    ])

    expectLayout(removeFromLayout(tree, 'f'), {
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: [
        row(['a', 'b', 'c'], [50, 25, 25]),
        row(['d', 'e'], [(50 / 75) * 100, (25 / 75) * 100])
      ]
    })
  })

  it('gives a closed middle bottom pane to its row and keeps the other row widths', () => {
    const tree = gridFromSplits([
      ['a', 'b', 'row'],
      ['b', 'c', 'row'],
      ['a', 'd', 'column'],
      ['b', 'e', 'column'],
      ['c', 'f', 'column']
    ])

    expectLayout(removeFromLayout(tree, 'e'), {
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: [
        row(['a', 'b', 'c'], [50, 25, 25]),
        row(['d', 'f'], [(50 / 75) * 100, (25 / 75) * 100])
      ]
    })
  })

  it('gives a closed top pane to the top row', () => {
    const tree = gridFromSplits([
      ['a', 'b', 'row'],
      ['b', 'c', 'row'],
      ['a', 'd', 'column'],
      ['b', 'e', 'column'],
      ['c', 'f', 'column']
    ])

    expectLayout(removeFromLayout(tree, 'c'), {
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: [
        row(['a', 'b'], [(50 / 75) * 100, (25 / 75) * 100]),
        row(['d', 'e', 'f'], [50, 25, 25])
      ]
    })
  })

  it('keeps above and below bands when a middle row pane closes', () => {
    const tree = row(
      [
        column(['A', 'D', 'G'], [30, 40, 30]),
        column(['B', 'E', 'H'], [30, 40, 30])
      ],
      [60, 40]
    )

    expectLayout(removeFromLayout(tree, 'E'), {
      type: 'split',
      direction: 'column',
      splitPercentages: [30, 40, 30],
      children: [row(['A', 'B'], [60, 40]), 'D', row(['G', 'H'], [60, 40])]
    })
  })

  it('aligns only the columns that share the closed pane edges', () => {
    const tree = row(
      [
        column(['A', 'D'], [30, 70]),
        column(['B', 'E'], [50, 50]),
        column(['C', 'F'], [50, 50])
      ],
      [30, 35, 35]
    )

    expectLayout(removeFromLayout(tree, 'F'), {
      type: 'split',
      direction: 'row',
      splitPercentages: [30, 70],
      children: [
        column(['A', 'D'], [30, 70]),
        {
          type: 'split',
          direction: 'column',
          splitPercentages: [50, 50],
          children: [row(['B', 'C'], [50, 50]), 'E']
        }
      ]
    })
  })

  it('collapses a column when no row surrounds it', () => {
    expect(
      removeFromLayout(
        { type: 'split', direction: 'column', splitPercentages: [40, 60], children: ['a', 'b'] },
        'b'
      )
    ).toBe('a')
  })

  it('rewrites a nested row and leaves the panes outside it', () => {
    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'column',
      splitPercentages: [20, 80],
      children: [
        'header',
        row([column(['A', 'D'], [50, 50]), column(['B', 'E'], [50, 50])], [40, 60])
      ]
    }

    expectLayout(removeFromLayout(tree, 'E'), {
      type: 'split',
      direction: 'column',
      splitPercentages: [20, 80],
      children: [
        'header',
        {
          type: 'split',
          direction: 'column',
          splitPercentages: [50, 50],
          children: [row(['A', 'B'], [40, 60]), 'D']
        }
      ]
    })
  })

  it('expands the stacked sibling when no horizontal neighbor shares the row', () => {
    const tree = row(['A', column(['C', 'F'], [40, 60])], [70, 30])
    expectLayout(removeFromLayout(tree, 'F'), row(['A', 'C'], [70, 30]))
  })

  it('keeps the current collapse when the closed pane already shares a row', () => {
    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'column',
      children: [
        {
          type: 'split',
          direction: 'row',
          children: ['A', { type: 'split', direction: 'row', children: ['B', 'C'] }]
        },
        {
          type: 'split',
          direction: 'row',
          children: ['D', { type: 'split', direction: 'row', children: ['E', 'F'] }]
        }
      ]
    }

    expect(removeFromLayout(tree, 'F')).toEqual({
      type: 'split',
      direction: 'column',
      children: [
        {
          type: 'split',
          direction: 'row',
          children: ['A', { type: 'split', direction: 'row', children: ['B', 'C'] }]
        },
        { type: 'split', direction: 'row', children: ['D', 'E'] }
      ]
    })
  })

  it('multiplies nested column sizes before aligning the row', () => {
    const nested = (top: string, middle: string, bottom: string): MosaicNode<string> => ({
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: [column([top, middle], [40, 60]), bottom]
    })
    const tree = row([nested('A', 'D', 'G'), nested('B', 'E', 'H')], [50, 50])

    expectLayout(removeFromLayout(tree, 'E'), {
      type: 'split',
      direction: 'column',
      splitPercentages: [20, 30, 50],
      children: [row(['A', 'B'], [50, 50]), 'D', row(['G', 'H'], [50, 50])]
    })
  })
})

function row(children: MosaicNode<string>[], splitPercentages: number[]): MosaicNode<string> {
  return { type: 'split', direction: 'row', splitPercentages, children }
}

function column(children: string[], splitPercentages: number[]): MosaicNode<string> {
  return { type: 'split', direction: 'column', splitPercentages, children }
}

function gridFromSplits(
  steps: Array<[string, string, 'row' | 'column']>
): MosaicNode<string> {
  let layout: MosaicNode<string> = steps[0][0]
  for (const [target, pane, direction] of steps) {
    const next = splitPaneInLayout(layout, target, pane, direction)
    if (!next) throw new Error(`failed to split ${target}`)
    layout = next
  }
  return layout
}

function expectLayout(actual: MosaicNode<string> | null, expected: MosaicNode<string>): void {
  expect(roundLayout(actual)).toEqual(roundLayout(expected))
}

function roundLayout(node: MosaicNode<string> | null): MosaicNode<string> | null {
  if (node === null || typeof node === 'string') return node
  if (node.type === 'tabs') return node
  return {
    ...node,
    splitPercentages: node.splitPercentages?.map((size) => Math.round(size * 10000) / 10000),
    children: node.children.map((child) => roundLayout(child) as MosaicNode<string>)
  }
}
