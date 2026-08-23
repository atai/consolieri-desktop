/**
 * Log non-fatal failures that are intentionally swallowed after a best-effort
 * side effect (cleanup, revoke, optional feature). Prefer this over empty catches.
 */
export function reportBestEffortFailure(context: string, error: unknown): void {
  console.debug(`[best-effort] ${context}`, error)
}
