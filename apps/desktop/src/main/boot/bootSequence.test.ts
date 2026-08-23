import { describe, expect, it, vi } from 'vitest'
import { runBootSequence } from './bootSequence'

describe('runBootSequence', () => {
  it('reports progress in order and runs steps', async () => {
    const labels: string[] = []
    const openDatabase = vi.fn()
    const startServices = vi.fn()
    const createMainWindow = vi.fn()
    const waitUntilReady = vi.fn().mockResolvedValue(undefined)

    await runBootSequence({
      onProgress: (label) => labels.push(label),
      openDatabase,
      startServices,
      createMainWindow,
      waitUntilReady
    })

    expect(labels).toEqual(['Preparing local database', 'Starting interface'])
    expect(openDatabase).toHaveBeenCalledOnce()
    expect(startServices).toHaveBeenCalledOnce()
    expect(createMainWindow).toHaveBeenCalledOnce()
    expect(waitUntilReady).toHaveBeenCalledOnce()
    expect(openDatabase.mock.invocationCallOrder[0]).toBeLessThan(
      startServices.mock.invocationCallOrder[0]!
    )
    expect(startServices.mock.invocationCallOrder[0]).toBeLessThan(
      createMainWindow.mock.invocationCallOrder[0]!
    )
  })

  it('continues after database failure', async () => {
    const labels: string[] = []
    const startServices = vi.fn()
    const createMainWindow = vi.fn()

    await runBootSequence({
      onProgress: (label, detail) => labels.push(detail ? `${label}: ${detail}` : label),
      openDatabase: () => {
        throw new Error('disk full')
      },
      startServices,
      createMainWindow,
      waitUntilReady: async () => undefined
    })

    expect(labels[0]).toBe('Preparing local database')
    expect(labels[1]).toBe('Database error: disk full')
    expect(labels[2]).toBe('Starting interface')
    expect(startServices).toHaveBeenCalledOnce()
    expect(createMainWindow).toHaveBeenCalledOnce()
  })
})
