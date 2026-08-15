import { useCallback, useEffect, useState } from 'react'
import type { ControlClientInfo, ControlServerStatus } from '@shared/types'
import { Button } from '../ui/Button'
import { InlineConfirmButton } from '../ui/InlineConfirmButton'

export function IntegrationsPanel(): React.JSX.Element {
  const [status, setStatus] = useState<ControlServerStatus | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [clients, setClients] = useState<ControlClientInfo[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async () => {
    const [nextStatus, nextClients, lastToken] = await Promise.all([
      window.consoleri.control.getStatus(),
      window.consoleri.control.listClients(),
      window.consoleri.control.getLastToken()
    ])
    setStatus(nextStatus)
    setClients(nextClients)
    if (lastToken) setToken(lastToken)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [nextStatus, nextClients, lastToken] = await Promise.all([
          window.consoleri.control.getStatus(),
          window.consoleri.control.listClients(),
          window.consoleri.control.getLastToken()
        ])
        if (cancelled) return
        setStatus(nextStatus)
        setClients(nextClients)
        if (lastToken) setToken(lastToken)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const enable = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const result = await window.consoleri.control.enable()
      setToken(result.token)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const disable = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await window.consoleri.control.disable()
      setToken(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const rotate = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const result = await window.consoleri.control.rotateToken()
      setToken(result.token)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const copyToken = async (): Promise<void> => {
    if (!token) return
    await window.consoleri.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const revoke = async (clientId: string): Promise<void> => {
    await window.consoleri.control.revokeClient(clientId)
    await refresh()
  }

  const toggleAlwaysAllow = async (client: ControlClientInfo): Promise<void> => {
    await window.consoleri.control.setClientAlwaysAllow(client.id, !client.alwaysAllow)
    await refresh()
  }

  const listeningLabel =
    status?.listening && status.port != null
      ? `${status.host}:${status.port}`
      : status?.enabled
        ? 'starting…'
        : 'off'

  return (
    <div className="max-w-2xl space-y-8 overflow-y-auto p-6">
      <div>
        <h2 className="mb-1 text-base font-semibold text-fg">Local Control API</h2>
        <p className="text-xs text-muted">
          Allows local tools (for example dev-manager) and MCP clients to open detached mosaic
          windows with ephemeral shells. Binds only to 127.0.0.1, requires a bearer token, and asks
          for confirmation before opening windows.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-4 rounded-lg border border-border bg-surface-raised p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-fg">Enable local control</p>
            <p className="text-xs text-muted">Status: {listeningLabel}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={status?.enabled === true}
            disabled={busy}
            onClick={() => void (status?.enabled ? disable() : enable())}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
              status?.enabled ? 'bg-accent' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                status?.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {status?.enabled && (
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <p className="mb-1 text-sm text-fg">Bearer token</p>
              <p className="mb-2 text-xs text-muted">
                Shown once after enable or rotate. Discovery file{' '}
                <code className="text-fg">control.json</code> lists the port only — never the token.
              </p>
              {token ? (
                <div className="flex flex-wrap items-center gap-2">
                  <code className="max-w-full truncate rounded bg-bg px-2 py-1 text-xs text-fg">
                    {token}
                  </code>
                  <Button type="button" size="sm" variant="default" onClick={() => void copyToken()}>
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  Token is not available after restart. Rotate to issue a new one.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="default" disabled={busy} onClick={() => void rotate()}>
                Rotate token
              </Button>
            </div>
            <p className="text-xs text-muted">
              MCP endpoint: <code className="text-fg">http://127.0.0.1:{status.port ?? '…'}/mcp</code>
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-fg">Trusted clients</h3>
        <p className="mb-3 text-xs text-muted">
          “Always allow” skips confirmation only when no pane includes a one-shot command.
        </p>
        {clients.length === 0 ? (
          <p className="text-xs text-muted">No clients yet.</p>
        ) : (
          <ul className="space-y-2">
            {clients.map((client) => (
              <li
                key={client.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm text-fg">{client.name}</p>
                  <p className="text-xs text-muted">
                    {client.alwaysAllow ? 'Always allow' : 'Confirm each window'}
                    {client.lastUsedAt ? ` · last used ${new Date(client.lastUsedAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() => void toggleAlwaysAllow(client)}
                  >
                    {client.alwaysAllow ? 'Require confirm' : 'Always allow'}
                  </Button>
                  <InlineConfirmButton
                    label="Revoke"
                    confirmLabel="Revoke?"
                    onConfirm={() => void revoke(client.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
