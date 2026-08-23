#!/usr/bin/env node
/**
 * Ensures design-system/hex.json matches tokens.css --hex-* bindings
 * and apps/desktop renderer theme/hex.ts mirrors hex.json.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokensPath = join(root, 'design-system/tokens.css')
const hexPath = join(root, 'design-system/hex.json')
const themeHexPath = join(root, 'apps/desktop/src/renderer/src/theme/hex.ts')

const tokens = readFileSync(tokensPath, 'utf8')
const hex = JSON.parse(readFileSync(hexPath, 'utf8'))
const themeSrc = readFileSync(themeHexPath, 'utf8')

const cssHex = {}
for (const m of tokens.matchAll(/--hex-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  const key = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  cssHex[key] = m[2].toLowerCase()
}

const errors = []

const requiredCss = ['bg', 'surface', 'accent', 'brand', 'success', 'danger', 'fg', 'muted', 'border']
for (const key of requiredCss) {
  if (!cssHex[key]) errors.push(`tokens.css missing --hex-${key}`)
  else if (!hex[key]) errors.push(`hex.json missing ${key}`)
  else if (cssHex[key] !== String(hex[key]).toLowerCase()) {
    errors.push(`mismatch ${key}: tokens.css=${cssHex[key]} hex.json=${hex[key]}`)
  }
}

for (const [key, value] of Object.entries(hex)) {
  const re = new RegExp(`${key}:\\s*'${value}'`, 'i')
  if (!re.test(themeSrc)) {
    errors.push(`theme/hex.ts missing or mismatched ${key}: ${value}`)
  }
}

if (errors.length) {
  console.error('Design token sync check failed:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}

console.log('Design token sync OK (%d hex.json keys)', Object.keys(hex).length)
