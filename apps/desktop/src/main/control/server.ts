import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { getDataDir } from '../paths'
import { appPreferencesRepository } from '../preferences/AppPreferencesRepository'
import {
  CONTROL_BIND_HOST,
  CONTROL_DEFAULT_PORT,
  extractBearerToken,
  isLoopbackRemoteAddress,
  tokensEqual,
  validateHostHeader,
  validateOriginHeader
} from './auth'
import {
  clearStoredTokenHash,
  generateControlToken,
  getStoredTokenHash,
  listControlClients,
  revokeControlClient,
  setClientAlwaysAllow,
  setStoredTokenHash,
  verifyToken
} from './clients'
import { appendControlAudit } from './audit'
import { closeAllMcpTransports, handleMcpHttpRequest } from './mcp'
import {
  closeControlWindow,
  focusControlWindow,
  getControlWindow,
  listControlWindows,
  openControlWindow
} from './useCases'
import type { ControlServerStatus } from '../../shared/types'

let server: Server | null = null
let listeningPort: number | null = null
let runtimeToken: string | null = null
let lastPlainToken: string | null = null

function controlJsonPath(): string {
  return join(getDataDir(), 'control.json')
}

function writeDiscoveryFile(port: number): void {
  mkdirSync(getDataDir(), { recursive: true })
  writeFileSync(
    controlJsonPath(),
    JSON.stringify(
      {
        port,
        host: CONTROL_BIND_HOST,
        pid: process.pid,
        version: app.getVersion()
      },
      null,
      2
    ),
    'utf8'
  )
}

function removeDiscoveryFile(): void {
  try {
    unlinkSync(controlJsonPath())
  } catch {
    /* ignore */
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
      if (chunks.reduce((n, c) => n + c.length, 0) > 1_000_000) {
        reject(new Error('Request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  })
  res.end(payload)
}

function clientNameFromRequest(req: IncomingMessage): string {
  const header = req.headers['x-consoleri-client']
  const raw = Array.isArray(header) ? header[0] : header
  const name = raw?.trim()
  return name && name.length > 0 ? name.slice(0, 120) : 'anonymous'
}

async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  bodyText: string
): Promise<void> {
  const clientName = clientNameFromRequest(req)
  const method = req.method ?? 'GET'
  const path = url.pathname

  if (method === 'GET' && path === '/v1/health') {
    sendJson(res, 200, { status: 'ok' })
    return
  }

  if (method === 'GET' && path === '/v1/windows') {
    sendJson(res, 200, { windows: listControlWindows() })
    return
  }

  if (method === 'POST' && path === '/v1/windows') {
    let raw: unknown
    try {
      raw = bodyText ? JSON.parse(bodyText) : {}
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' })
      return
    }
    try {
      const opened = await openControlWindow({ clientName, recipeRaw: raw })
      sendJson(res, 200, opened)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined
      if (code === 'DENIED') {
        sendJson(res, 403, { error: message, status: 'denied' })
        return
      }
      if (message.includes('must be') || message.includes('not allowed') || message.includes('Invalid')) {
        sendJson(res, 400, { error: message })
        return
      }
      // Zod errors
      if (err && typeof err === 'object' && 'issues' in err) {
        sendJson(res, 400, { error: 'Invalid recipe', details: err })
        return
      }
      console.error('[control] open window failed:', err)
      sendJson(res, 500, { error: message })
    }
    return
  }

  const windowMatch = /^\/v1\/windows\/([^/]+)(\/focus)?$/.exec(path)
  if (windowMatch) {
    const id = decodeURIComponent(windowMatch[1])
    const isFocus = Boolean(windowMatch[2])

    if (method === 'GET' && !isFocus) {
      const info = getControlWindow(id)
      if (!info) {
        sendJson(res, 404, { error: 'Window not found' })
        return
      }
      sendJson(res, 200, info)
      return
    }

    if (method === 'POST' && isFocus) {
      if (!focusControlWindow(id)) {
        sendJson(res, 404, { error: 'Window not found' })
        return
      }
      appendControlAudit({
        client: clientName,
        method,
        path,
        outcome: 'focused',
        detail: id
      })
      sendJson(res, 200, getControlWindow(id))
      return
    }

    if (method === 'DELETE' && !isFocus) {
      if (!closeControlWindow(id)) {
        sendJson(res, 404, { error: 'Window not found' })
        return
      }
      appendControlAudit({
        client: clientName,
        method,
        path,
        outcome: 'closed',
        detail: id
      })
      sendJson(res, 200, { closed: true, id })
      return
    }
  }

  sendJson(res, 404, { error: 'Not found' })
}

async function onRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const port = listeningPort
  if (port == null) {
    sendJson(res, 503, { error: 'Not listening' })
    return
  }

  if (!isLoopbackRemoteAddress(req.socket.remoteAddress)) {
    sendJson(res, 403, { error: 'Forbidden' })
    return
  }

  if (!validateHostHeader(req, port)) {
    sendJson(res, 403, { error: 'Invalid Host header' })
    return
  }

  if (!validateOriginHeader(req)) {
    sendJson(res, 403, { error: 'Invalid Origin header' })
    return
  }

  const url = new URL(req.url ?? '/', `http://${CONTROL_BIND_HOST}:${port}`)
  const isHealth = (req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/v1/health'

  if (!isHealth) {
    const token = extractBearerToken(req)
    const ok =
      token != null &&
      ((runtimeToken != null && tokensEqual(token, runtimeToken)) || verifyToken(token))
    if (!ok) {
      sendJson(res, 401, { error: 'Unauthorized' })
      return
    }
  }

  let bodyText = ''
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      bodyText = await readBody(req)
    }
  } catch (err) {
    sendJson(res, 413, { error: err instanceof Error ? err.message : 'Body error' })
    return
  }

  if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
    let body: unknown = undefined
    if (bodyText) {
      try {
        body = JSON.parse(bodyText)
      } catch {
        sendJson(res, 400, { error: 'Invalid JSON body' })
        return
      }
    }
    await handleMcpHttpRequest(req, res, body, clientNameFromRequest(req))
    return
  }

  await handleApiRequest(req, res, url, bodyText)
}

function listenOnPort(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer((req, res) => {
      void onRequest(req, res)
    })
    s.once('error', reject)
    s.listen(port, CONTROL_BIND_HOST, () => {
      server = s
      const addr = s.address()
      const actual = typeof addr === 'object' && addr ? addr.port : port
      listeningPort = actual
      resolve(actual)
    })
  })
}

export function getControlServerStatus(): ControlServerStatus {
  const enabled = appPreferencesRepository.getAppSettings().externalControl.enabled
  return {
    enabled,
    listening: server != null && listeningPort != null,
    host: CONTROL_BIND_HOST,
    port: listeningPort
  }
}

export function getLastIssuedControlToken(): string | null {
  return lastPlainToken
}

export async function startControlServer(options?: {
  issueNewToken?: boolean
}): Promise<{ port: number; token: string | null }> {
  await stopControlServer()

  let token: string | null = null
  if (options?.issueNewToken || !getStoredTokenHash()) {
    token = generateControlToken()
    setStoredTokenHash(token)
    lastPlainToken = token
    runtimeToken = token
  } else {
    // Existing hash verifies requests; plaintext may be unknown after restart.
    lastPlainToken = null
    runtimeToken = null
  }

  let port: number
  try {
    port = await listenOnPort(CONTROL_DEFAULT_PORT)
  } catch {
    port = await listenOnPort(0)
  }

  writeDiscoveryFile(port)
  appendControlAudit({
    client: 'system',
    method: 'START',
    path: '/',
    outcome: 'listening',
    detail: `${CONTROL_BIND_HOST}:${port}`
  })
  return { port, token }
}

export async function stopControlServer(): Promise<void> {
  await closeAllMcpTransports()
  if (server) {
    await new Promise<void>((resolve) => {
      server!.close(() => resolve())
    })
    server = null
  }
  listeningPort = null
  runtimeToken = null
  removeDiscoveryFile()
}

export async function syncControlServerWithSettings(): Promise<void> {
  const enabled = appPreferencesRepository.getAppSettings().externalControl.enabled
  if (enabled) {
    if (!server) {
      await startControlServer({ issueNewToken: !getStoredTokenHash() })
    }
  } else if (server) {
    await stopControlServer()
  }
}

export async function enableControlApi(): Promise<{ port: number; token: string }> {
  appPreferencesRepository.setAppSettings({ externalControl: { enabled: true } })
  const result = await startControlServer({ issueNewToken: true })
  return { port: result.port, token: result.token! }
}

export async function disableControlApi(): Promise<void> {
  appPreferencesRepository.setAppSettings({ externalControl: { enabled: false } })
  await stopControlServer()
  clearStoredTokenHash()
  lastPlainToken = null
}

export async function rotateControlToken(): Promise<string> {
  const token = generateControlToken()
  setStoredTokenHash(token)
  runtimeToken = token
  lastPlainToken = token
  if (!server) {
    appPreferencesRepository.setAppSettings({ externalControl: { enabled: true } })
    await startControlServer({ issueNewToken: false })
    runtimeToken = token
    lastPlainToken = token
  }
  return token
}

export {
  listControlClients,
  revokeControlClient,
  setClientAlwaysAllow
}
