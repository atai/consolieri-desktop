# Consoleri Brand Guide

## Identity

**Consoleri** is a Windows-first Electron SSH host manager, terminal multiplexer, and infrastructure visualization tool for DevOps engineers.

- Product name is always **Consoleri** (never "Console" alone).
- Version shown in chrome when space allows: `v0.4.7`.

## Logo

**Locked mark only:** flat pointy-top hexagon `#f59e0b` with a circular center aperture on ink `#0c141f`.

| File | Use |
|------|-----|
| `logos/primary.svg` / `assets/logo.svg` | Primary mark |
| `logos/on-dark.svg` | Rounded app tile |
| `logos/mono.svg` | Mono / light-on-dark |
| `logos/wordmark.svg` | Mark + wordmark lockup |
| `logos/mark.png` / `assets/logo-mark.png` | Raster mark with soft shadow |
| `logos/app-icon.png` | Electron app icon |

Rebuild all rasters from the SVG master: `node assets/_brand/rebuild-rasters.cjs`.

**Do not invent** C-stroke hexes, 3D cubes, network-wireframe glyphs, or other alternate marks.

## Color

| Role | Hex | Use |
|------|-----|-----|
| Background | `#0c141f` | App canvas |
| Surface | `#151d2b` | Cards, lists, modals |
| Foreground | `#f1f5f9` | Primary text |
| Muted | `#8b9bb4` | Metadata |
| Border | `#2a3548` | Dividers |
| Accent | `#2b7fff` | Primary actions |
| Brand amber | `#f59e0b` | Logo + active tab |

Full tokens live in `colors_and_type.css` and `brand.json`.

## Typography

- **Display / body:** system UI stack (`Segoe UI` / `-apple-system` / `system-ui`) — Windows-first, no proprietary display face in evidence.
- **Mono:** `JetBrains Mono` (paths, fingerprints, terminal, table headers). Web substitute via Google Fonts; no `.ttf`/`.otf` shipped in source.

## Voice

Direct, technical, imperative labels: `Connect`, `Refresh`, `Run`, `Deploy`. Section headers uppercase for workflow stages (`CONNECT`, `CONNECTION PROFILES`).

## Imagery

Prefer production screenshots, empty states that reuse the locked mark, and dark marketing frames. Avoid purple SaaS gradients, emoji icons, and light-theme product chrome by default.

Registered samples: `imagery/` (splash, lockups, empty states, product screenshots). Canonical masters also live under `assets/`.

## Agent prompt guide

1. Read `DESIGN.md`, `brand.json`, and `colors_and_type.css` before generating UI.
2. Bind Consoleri tokens — do not invent a new palette.
3. Use `logos/primary.svg` (or `assets/logo.svg`) for any brand mark.
4. Compose product UI from `ui_kits/app/` patterns.
5. Default to the dark production theme unless the brief is a density/viz experiment.
