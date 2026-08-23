export type OAuthCallbackKind = 'success' | 'error'

export type OAuthCallbackPageOptions = {
  kind: OAuthCallbackKind
  product: string
  message: string
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Consolieri">
  <defs>
    <mask id="consoleri-aperture-tile">
      <rect width="64" height="64" fill="#fff"/>
      <circle cx="32" cy="32" r="8" fill="#000"/>
    </mask>
  </defs>
  <rect width="64" height="64" rx="14" fill="#0c141f"/>
  <g transform="translate(32 32) scale(0.72) translate(-32 -32)">
    <polygon points="32,4 55.5,17.5 55.5,46.5 32,60 8.5,46.5 8.5,17.5" fill="#f59e0b" mask="url(#consoleri-aperture-tile)"/>
  </g>
</svg>`

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildOAuthCallbackHtml(options: OAuthCallbackPageOptions): string {
  const product = escapeHtml(options.product)
  const message = escapeHtml(options.message)
  const statusColor = options.kind === 'success' ? '#10b981' : '#ef4444'
  const statusLabel = options.kind === 'success' ? 'Success' : 'Error'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${product}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      background: #0c141f;
      color: #f1f5f9;
      font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    }
    main {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 28px 24px;
      text-align: center;
    }
    .logo {
      width: 64px;
      height: 64px;
      border-radius: 14px;
      border: 1px solid #2a3548;
    }
    h1 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .status {
      margin: 4px 0 0;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${statusColor};
    }
    .message {
      margin: 0;
      max-width: 320px;
      font-size: 0.875rem;
      line-height: 1.45;
      color: #8b9bb4;
    }
  </style>
</head>
<body>
  <main>
    <div class="logo" aria-hidden="true">${LOGO_SVG}</div>
    <h1>${product}</h1>
    <p class="status">${statusLabel}</p>
    <p class="message">${message}</p>
  </main>
</body>
</html>`
}
