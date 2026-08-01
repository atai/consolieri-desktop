# Consoleri Design System

This package captures a source-backed Open Design design system for **Consoleri** — a desktop Electron SSH host manager, terminal multiplexer, and infrastructure visualization tool. It includes reusable rules, token CSS, focused review previews, preserved screenshots, a density prototype, and an applied UI kit.

## Product Overview

Consoleri (v0.4.7) is a Windows-first Electron app for DevOps and platform engineers who manage large fleets of SSH hosts, connection profiles, keys, terminal sessions, connectivity reports, and network topology maps. Primary surfaces include:

- **Hosts** — tag-grouped host list with search, filters, and a bottom connection panel
- **Profiles** — shared SSH/RDP connection profiles across hosts
- **Keys** — SSH key management with deploy/assign actions
- **Terminal** — split-pane SSH sessions with layout toggles
- **Reports** — connectivity/inventory test results with export
- **Network map** — interactive logical/network topology visualization

The source project also includes `electron-viz-multi-screen.html`, a light-theme prototype exploring table density, hierarchy, and chart readability for 10k–100k row datasets.

## Source Context

- Source project: `eff54ab4-aed5-4420-b27a-179fa6c1cedb` ("Electron Приложение Нужно Улучшить Визуализацию")
- Evidence: 7 production screenshots + visualization prototype
- See `context/source-context.md` and `context/provenance.md`

## Package Contents

| Path | Purpose |
|------|---------|
| `DESIGN.md` | Canonical design rules and component documentation |
| `BRAND.md` | Brand guide for agents (logo lockup, voice, imagery) |
| `brand.json` | Design System tab kit — logo, palette, type, imagery modules |
| `colors_and_type.css` | Reusable CSS variables for color, type, spacing, radius, motion |
| `preview/` | Focused HTML review cards |
| `logos/` | Primary mark + alternates wired into `brand.json` |
| `imagery/` | Splash, empty states, product screenshots for the Images module |
| `assets/` | Logo system, icons, illustrations, marketing art, screenshots |
| `build/icons/` | Electron packaging icons (`icon.png`, `tray.png`, `store-tile.png`) |
| `source_examples/` | High-signal source artifact (`electron-viz-multi-screen.html`) |
| `ui_kits/app/` | Applied Consoleri interface kit with modular React components |
| `context/` | Source context and provenance notes |

## Preview Manifest

- `preview/colors-primary.html` — accent blue, brand orange, semantic status colors
- `preview/colors-theme-dark.html` — dark production surfaces, borders, text hierarchy
- `preview/typography-specimens.html` — sans/mono specimens for host lists, paths, table headers
- `preview/spacing-tokens.html` — sidebar width, row heights, panel rhythm, radius scale
- `preview/components-buttons.html` — HostList, ConnectionPanel, StatusBadge, TabBar controls
- `preview/brand-assets.html` — logo system, app/tray icons, empty states, marketing, screenshots
- `preview/applied-ui-surfaces.html` — Hosts, Profiles, Keys, Network map surface references

## Brand asset map

One locked mark (orange hexagon + circular aperture) shared by every logo/icon/splash PNG. Rebuild: `node assets/_brand/rebuild-rasters.cjs`.

| Need | File |
|------|------|
| App icon | `assets/icons/app-icon.png` → `build/icons/icon.png` |
| Tray | `assets/icons/tray-icon.svg` / `.png` → `build/icons/tray.png` |
| Logo / wordmark | `assets/logo.svg`, `assets/logo-on-dark.svg`, `assets/wordmark.svg` |
| Empty Hosts / Keys / Map | `assets/illustrations/empty-*.png` |
| Splash / About / Hero | `assets/marketing/` |

## Review Workflow

1. Open the **Design System** tab — Logo / Images / Palette come from `brand.json` (not only Design Files).
2. Read `DESIGN.md` + `BRAND.md` for product and brand rules.
3. Open `preview/brand-assets.html` for the unified brand set.
4. Open `preview/colors-theme-dark.html` and `preview/components-buttons.html` for core UI language.
5. Open `ui_kits/app/index.html` for the composed Consoleri shell.
6. Compare `source_examples/electron-viz-multi-screen.html` for density/visualization patterns.

## Reuse

```html
<link rel="stylesheet" href="colors_and_type.css">
```

Import tokens, compose from `ui_kits/app/components/`, and reference `assets/screenshots/` for visual regression. Default new surfaces to the dark production theme unless building visualization experiments.
