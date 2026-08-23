import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import {
  closeControlWindow,
  focusControlWindow,
  getControlWindow,
  listControlWindows,
  openControlWindow
} from './useCases'
import { ControlWindowRecipeSchema } from './recipes'
import { reportBestEffortFailure } from '../../shared/bestEffort'

const transports = new Map<string, StreamableHTTPServerTransport>()

function createMcpServer(clientName: string): McpServer {
  const server = new McpServer({
    name: 'consoleri-control',
    version: '1.0.0'
  })

  server.registerTool(
    'list_windows',
    {
      description: 'List Consolieri workspace windows opened via the control API',
      inputSchema: {}
    },
    async () => {
      const windows = listControlWindows()
      return {
        content: [{ type: 'text', text: JSON.stringify(windows, null, 2) }]
      }
    }
  )

  server.registerTool(
    'open_service_window',
    {
      description:
        'Open (or focus) a detached mosaic window with ephemeral local shell panes. Requires in-app confirmation unless the client is trusted and no pane has a command.',
      inputSchema: {
        key: z.string().optional().describe('Idempotency key, e.g. dev-manager:myapp'),
        title: z.string().describe('Window title'),
        panes: z
          .array(
            z.object({
              title: z.string(),
              localShell: z
                .enum(['powershell', 'pwsh', 'cmd', 'bash', 'zsh', 'sh', 'wsl'])
                .optional(),
              wslDistro: z.string().optional(),
              cwd: z.string().describe('Absolute working directory'),
              command: z
                .string()
                .optional()
                .describe('Optional one-shot command after connect (always requires confirmation)')
            })
          )
          .min(1)
          .max(16)
      }
    },
    async (args) => {
      try {
        const parsed = ControlWindowRecipeSchema.parse(args)
        const opened = await openControlWindow({
          clientName,
          recipeRaw: parsed
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(opened, null, 2) }]
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined
        if (code === 'DENIED') {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: 'Denied or timed out. Approve the dialog in Consolieri and retry.'
              }
            ]
          }
        }
        return {
          isError: true,
          content: [{ type: 'text', text: message }]
        }
      }
    }
  )

  server.registerTool(
    'focus_window',
    {
      description: 'Focus an existing control workspace window by id',
      inputSchema: {
        id: z.string()
      }
    },
    async ({ id }) => {
      const ok = focusControlWindow(id)
      if (!ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Window not found: ${id}` }]
        }
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(getControlWindow(id), null, 2) }]
      }
    }
  )

  server.registerTool(
    'close_window',
    {
      description: 'Close a control workspace window and kill its ephemeral sessions',
      inputSchema: {
        id: z.string()
      }
    },
    async ({ id }) => {
      const ok = closeControlWindow(id)
      if (!ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Window not found: ${id}` }]
        }
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ closed: true, id }) }]
      }
    }
  )

  return server
}

export async function handleMcpHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
  clientName: string
): Promise<void> {
  const sessionIdHeader = req.headers['mcp-session-id']
  const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader

  try {
    if (sessionId && transports.has(sessionId)) {
      const transport = transports.get(sessionId)!
      await transport.handleRequest(req, res, body)
      return
    }

    if (!sessionId && isInitializeRequest(body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (id) => {
          transports.set(id, transport)
        }
      })
      transport.onclose = () => {
        const id = transport.sessionId
        if (id) transports.delete(id)
      }
      const server = createMcpServer(clientName)
      await server.connect(transport)
      await transport.handleRequest(req, res, body)
      return
    }

    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null
      })
    )
  } catch (err) {
    console.error('[control] MCP request failed:', err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null
        })
      )
    }
  }
}

export async function closeAllMcpTransports(): Promise<void> {
  for (const transport of transports.values()) {
    try {
      await transport.close()
    } catch (error) {
      reportBestEffortFailure('close MCP transport', error)
    }
  }
  transports.clear()
}
