import type { SessionManager } from './SessionManager'

/**
 * Late-bound SessionManager used by modules that sit below the composition root
 * in the import graph (e.g. OperationLog ← ProfileRepository ← compositionRoot).
 * Bound once from compositionRoot after construction.
 */
let bound: SessionManager | null = null

export function bindSessionManager(manager: SessionManager): void {
  bound = manager
}

export function getSessionManager(): SessionManager {
  if (!bound) {
    throw new Error('SessionManager is not bound yet')
  }
  return bound
}

/** Call-site convenience — methods resolve against the bound instance. */
export const sessionManager: SessionManager = new Proxy({} as SessionManager, {
  get(_target, property, receiver) {
    const manager = getSessionManager()
    const value = Reflect.get(manager as object, property, receiver)
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(manager) : value
  }
})
