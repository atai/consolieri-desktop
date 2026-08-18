# Consoleri

Monorepo for Consoleri — a desktop host console manager (SSH, shells, RDP, VNC).

**Cloud backend:** [https://consolieri.app/](https://consolieri.app/) — optional cloud companion for encrypted backups, settings sync across devices, and upcoming advanced features.

**Documentation:** [https://atai.github.io/consolieri-desktop/](https://atai.github.io/consolieri-desktop/) (published on each release) · sources in [`docs/source/`](docs/source/)

## Structure

- `apps/desktop` — Electron application (`@consoleri/desktop`)
- `packages/core` — shared pure functions (`@consoleri/core`)
- `scripts/` — root tooling (dev launcher, native rebuild, etc.)
- `docs/` — Sphinx / reStructuredText documentation

## Prerequisites

- Node.js 20+

pnpm is bundled in the repo (`devDependencies`). You do **not** need a global `pnpm` install.

## Setup

```bash
# First time (fresh clone) — bootstrap with npx if pnpm is not on PATH:
npx pnpm install

# Afterwards, or if node_modules already exists:
npm run install:deps
# postinstall downloads Electron (if needed) and rebuilds node-pty for Electron
npm run rebuild-native     # optional re-run if local terminals break after Electron upgrades
```

> If install scripts were skipped, run `npm run install:electron` then `npm run rebuild-native`.

## Development

```bash
npm run dev
```

`npm run dev` runs a full `electron-vite build` first, then starts the dev server — so the app always launches with the latest compiled main/preload/renderer bundles.

For hot-reload only (skip pre-build):

```bash
node scripts/pnpm.mjs --filter @consoleri/desktop dev:watch
```

If you have `pnpm` on PATH, `pnpm dev` works the same way.

## Build

```bash
npm run build
npm run package
```

## Test

```bash
npm run test
```

## Documentation

Built docs are on GitHub Pages: [https://atai.github.io/consolieri-desktop/](https://atai.github.io/consolieri-desktop/) (updated on each release). Sources: [`docs/source/`](docs/source/).

To preview locally:

```bash
python3 -m venv docs/.venv
docs/.venv/bin/pip install -r docs/requirements.txt
cd docs && make html
```

Then open `docs/build/html/index.html`. Agent and contributor notes: [`docs/source/agent.rst`](docs/source/agent.rst). Release and CI signing secrets: [`docs/source/release.rst`](docs/source/release.rst), [`docs/source/ci-secrets.rst`](docs/source/ci-secrets.rst).

## Release

See [Release process](docs/source/release.rst). Short version:

```bash
# Preview the next version and changelog
npm run release -- --dry-run patch

# Bump version, update CHANGELOG.md, commit, tag, and push to origin
# (pushing the tag starts the GitHub Actions Release workflow)
npm run release -- patch   # or minor | major
```

If you only push a version bump to `main` without a tag, the **Tag version** workflow creates `vX.Y.Z` automatically when that tag is missing.

Release commits use the message `chore(release): vX.Y.Z` and are excluded from future changelogs.
Pass `--no-test` to skip the pre-release test run, `--no-push` to create commit+tag locally only.
