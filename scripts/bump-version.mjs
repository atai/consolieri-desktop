import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const PACKAGE_FILES = [
  join(root, 'package.json'),
  join(root, 'apps/desktop/package.json'),
  join(root, 'packages/core/package.json')
]

const APP_VERSION_FILE = join(root, 'apps/desktop/src/shared/appVersion.ts')
const CHANGELOG_FILE = join(root, 'CHANGELOG.md')
const CLIFF_CONFIG = join(root, 'cliff.toml')

const BUMP_TYPES = new Set(['patch', 'minor', 'major'])

function readVersion() {
  const pkg = JSON.parse(readFileSync(PACKAGE_FILES[0], 'utf8'))
  const version = pkg.version
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid version in package.json: ${version}`)
  }
  return version
}

function bumpSemver(version, bumpType) {
  const [major, minor, patch] = version.split('.').map(Number)
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Unknown bump type: ${bumpType}`)
  }
}

function setAppVersion(version) {
  const content = readFileSync(APP_VERSION_FILE, 'utf8')
  const updated = content.replace(
    /^export const APP_VERSION = '[^']*'$/m,
    `export const APP_VERSION = '${version}'`
  )
  if (updated === content) {
    throw new Error(`Could not update APP_VERSION in ${APP_VERSION_FILE} — pattern not found`)
  }
  writeFileSync(APP_VERSION_FILE, updated, 'utf8')
}

function setVersion(version) {
  for (const file of PACKAGE_FILES) {
    const pkg = JSON.parse(readFileSync(file, 'utf8'))
    pkg.version = version
    writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  }
  setAppVersion(version)
}

function requireCleanTree() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8'
  })
  if (result.error) {
    throw new Error(`git is not available: ${result.error.message}`)
  }
  if (result.status !== 0) {
    throw new Error(`git status failed: ${(result.stderr || '').trim()}`)
  }
  if (result.stdout.trim()) {
    throw new Error(
      'Working tree is not clean. Commit or stash changes before bumping the version.'
    )
  }
}

function resolveCliffCommand() {
  for (const cmd of [
    ['git', ['cliff']],
    ['git-cliff', []]
  ]) {
    const [bin, prefix] = cmd
    const probe = spawnSync(bin, [...prefix, '--version'], {
      cwd: root,
      encoding: 'utf8'
    })
    if (probe.status === 0) {
      return { bin, prefix }
    }
  }
  throw new Error(
    `git-cliff is not installed or not in PATH.

Install git-cliff:
  Windows:  scoop install git-cliff
            choco install git-cliff
  macOS:    brew install git-cliff
  Linux:    cargo install git-cliff`
  )
}

/** Prepend a Keep-a-Changelog section for vX.Y.Z via git-cliff. */
function updateChangelog(version) {
  const { bin, prefix } = resolveCliffCommand()
  const tag = `v${version}`
  const args = [
    ...prefix,
    '--config',
    CLIFF_CONFIG,
    '--unreleased',
    '--prepend',
    CHANGELOG_FILE,
    '--tag',
    tag
  ]
  const result = spawnSync(bin, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`git-cliff failed while updating CHANGELOG.md for ${tag}`)
  }
}

const VERSION_PATHS = [
  'CHANGELOG.md',
  'package.json',
  'apps/desktop/package.json',
  'packages/core/package.json',
  'apps/desktop/src/shared/appVersion.ts'
]

function commitVersion(version) {
  const add = spawnSync('git', ['add', '--', ...VERSION_PATHS], {
    cwd: root,
    encoding: 'utf8'
  })
  if (add.status !== 0) {
    throw new Error(`git add failed: ${(add.stderr || '').trim()}`)
  }

  const commit = spawnSync(
    'git',
    ['commit', '-m', `chore(release): v${version}`],
    { cwd: root, stdio: 'inherit' }
  )
  if (commit.status !== 0) {
    throw new Error(`git commit failed for v${version}`)
  }
}

function usage() {
  console.error(
    'Usage: node scripts/bump-version.mjs <patch|minor|major|X.Y.Z> [--dry-run] [--no-commit]\n' +
      '  Requires a clean git working tree (unless --dry-run).\n' +
      '  Updates package.json files, appVersion.ts, and CHANGELOG.md via git-cliff,\n' +
      '  then commits with message chore(release): vX.Y.Z (unless --no-commit).'
  )
  process.exit(1)
}

const FLAGS = new Set(['--dry-run', '--no-commit'])
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const noCommit = args.includes('--no-commit')
const bumpArg = args.find((arg) => !FLAGS.has(arg))

if (!bumpArg) {
  usage()
}

const currentVersion = readVersion()
let newVersion

if (BUMP_TYPES.has(bumpArg)) {
  newVersion = bumpSemver(currentVersion, bumpArg)
} else if (/^\d+\.\d+\.\d+$/.test(bumpArg)) {
  newVersion = bumpArg
} else {
  usage()
}

if (dryRun) {
  console.log(newVersion)
  process.exit(0)
}

try {
  requireCleanTree()
  updateChangelog(newVersion)
  setVersion(newVersion)
  if (!noCommit) {
    commitVersion(newVersion)
  }
  console.log(newVersion)
} catch (err) {
  console.error(`bump-version: ${err instanceof Error ? err.message : err}`)
  process.exit(1)
}
