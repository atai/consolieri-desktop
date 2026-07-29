#!/usr/bin/env node
/**
 * Print the CHANGELOG.md section for a given version (e.g. 0.4.10 or v0.4.10).
 *
 * Usage:
 *   node scripts/changelog-section.mjs <version>
 *   node scripts/changelog-section.mjs <version> --allow-missing
 *
 * Exit codes:
 *   0 — wrote section (or empty file with --allow-missing)
 *   1 — missing/empty section without --allow-missing
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const allowMissing = args.includes('--allow-missing')
const raw = args.find((a) => !a.startsWith('-'))

if (!raw) {
  console.error('Usage: node scripts/changelog-section.mjs <version> [--allow-missing]')
  process.exit(1)
}

const version = raw.replace(/^v/, '')
const changelogPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'CHANGELOG.md')
const text = readFileSync(changelogPath, 'utf8')

// Keep a Changelog: ## [0.4.10] - 2026-07-29  or  ## [0.4.10]
const heading = new RegExp(
  `^## \\[${version.replace(/\./g, '\\.')}\\](?:\\s*-\\s*\\S+)?\\s*$`,
  'm'
)
const match = heading.exec(text)
if (!match) {
  if (allowMissing) {
    process.exit(0)
  }
  console.error(`No CHANGELOG section found for version ${version}`)
  process.exit(1)
}

const start = match.index + match[0].length
const rest = text.slice(start)
const nextHeading = rest.search(/^## \[/m)
const body = (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim()

if (!body) {
  if (allowMissing) {
    process.exit(0)
  }
  console.error(`CHANGELOG section for ${version} is empty`)
  process.exit(1)
}

process.stdout.write(`${body}\n`)
