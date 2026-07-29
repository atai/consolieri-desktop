import initIronRdp, * as ironrdpWasm from 'ironrdp-wasm'
// Resolved via electron.vite.config.ts alias — package exports omit the wasm subpath.
import wasmUrl from '@ironrdp-wasm-bg?url'

let initPromise: Promise<void> | null = null

export async function ensureIronRdpReady(): Promise<typeof ironrdpWasm> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initIronRdp(wasmUrl)
        ironrdpWasm.setup('info')
      } catch (err) {
        initPromise = null
        const message = err instanceof Error ? err.message : String(err)
        throw new Error(`Failed to initialize RDP client (WASM): ${message}`)
      }
    })()
  }

  await initPromise
  return ironrdpWasm
}

export { formatIronError, logRdpError } from './rdpErrors'
