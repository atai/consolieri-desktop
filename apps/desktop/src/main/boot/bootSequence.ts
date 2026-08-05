export type BootProgressCallback = (label: string, detail?: string) => void

export interface BootSequenceDeps {
  onProgress: BootProgressCallback
  openDatabase: () => void
  startServices: () => void
  createMainWindow: () => void
  waitUntilReady: () => Promise<void>
}

function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

/**
 * Runs cold-start work in reportable steps, yielding the event loop between
 * sync chunks so the splash window can paint and receive progress updates.
 */
export async function runBootSequence(deps: BootSequenceDeps): Promise<void> {
  await yieldEventLoop()

  deps.onProgress('Preparing local database')
  try {
    deps.openDatabase()
  } catch (error) {
    console.error('[boot] Database initialization failed:', error)
    deps.onProgress(
      'Database error',
      error instanceof Error ? error.message : String(error)
    )
  }

  await yieldEventLoop()

  deps.onProgress('Starting interface')
  try {
    deps.startServices()
    deps.createMainWindow()
  } catch (error) {
    console.error('[boot] Interface startup failed:', error)
    deps.onProgress(
      'Startup error',
      error instanceof Error ? error.message : String(error)
    )
  }

  await deps.waitUntilReady()
}
