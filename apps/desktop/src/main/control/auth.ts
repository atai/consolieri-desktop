import type { IncomingMessage } from 'node:http'
import { timingSafeEqual } from 'node:crypto'

export const CONTROL_BIND_HOST = '127.0.0.1'
export const CONTROL_DEFAULT_PORT = 19847

export function extractBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization
  if (!header || typeof header !== 'string') return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]?.trim() || null
}

export function tokensEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function validateHostHeader(req: IncomingMessage, port: number): boolean {
  const host = req.headers.host
  if (!host || typeof host !== 'string') return false
  const allowed = new Set([
    `127.0.0.1:${port}`,
    `localhost:${port}`,
    `[::1]:${port}`
  ])
  return allowed.has(host.toLowerCase())
}

export function validateOriginHeader(req: IncomingMessage): boolean {
  const origin = req.headers.origin
  if (origin === undefined) return true
  if (typeof origin !== 'string' || !origin) return false
  try {
    const url = new URL(origin)
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '[::1]'
  } catch {
    return false
  }
}

export function isLoopbackRemoteAddress(address: string | undefined): boolean {
  if (!address) return false
  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1'
  )
}
