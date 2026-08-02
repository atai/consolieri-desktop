---
name: consoleri-design
description: Use this skill when creating Open Design artifacts that match the Consoleri desktop SSH host manager and infrastructure visualization tool.
user-invocable: true
---

Read USAGE.md, README.md, DESIGN.md, BRAND.md, brand.json, tokens.css, the preview cards, preserved assets, source examples, and the modular UI kit before generating any new interface.

**What is inside:**
- Source-backed visual foundations for Consoleri's dark production UI and light density prototype
- `brand.json` + `BRAND.md` — Design System tab kit (logo, palette, imagery)
- CSS design tokens in `tokens.css` (OD charter) + `tokens.app-extensions.css`
- Preserved production screenshots under `assets/screenshots/`
- Brand logo system — locked hexagon+aperture mark (`logos/primary.svg` / `assets/logo.svg`); rebuild PNGs via `assets/_brand/rebuild-rasters.cjs`
- Kit mirrors under `logos/` and `imagery/` for the Design System Logo / Images modules
- App/tray/store icons under `assets/icons/` and `build/icons/`
- Empty-state and marketing art under `assets/illustrations/` and `assets/marketing/`
- Focused preview cards in `preview/`
- Applied UI kit at `ui_kits/app/` with Sidebar, TabBar, HostList, ConnectionPanel, StatusBadge, and App shell
- Source example `source_examples/electron-viz-multi-screen.html`

**Source context:**
This design system is based on Consoleri v0.4.7 screenshots and an electron visualization prototype from Open Design project `eff54ab4-aed5-4420-b27a-179fa6c1cedb`. The product is a desktop Electron app for SSH host management, terminal sessions, connectivity reports, and network topology maps.

**When to use this skill:**
- Creating Consoleri-aligned mockups, prototypes, or review artifacts
- Designing new UI modules for host lists, connection panels, terminal chrome, or network maps
- Building density/table visualization experiments grounded in the electron-viz prototype

**How to use:**
Load `tokens.css` (or `tailwind-v4.css` in Tailwind apps), inspect `preview/`, reuse `ui_kits/app/` components, and preserve dark-theme density. Reference `assets/screenshots/` for visual fidelity. Read `DESIGN.md` before introducing new component patterns.

**Design system highlights:**
- Colors: near-black canvas, electric-blue primary (`--consoleri-accent`), orange tab indicator (`--consoleri-tab-active`), green/red semantic status
- Typography: system sans for UI, monospace for paths/fingerprints/table headers with tabular-nums
- Layout: 52px icon sidebar, centered tab bar, tag-grouped host lists, bottom connection panel, split terminal panes
- Components: HostList rows, ConnectionPanel profiles, StatusBadge OK/FAIL, TabBar, network map nodes
- Interaction: gold terminal layout selection border, 200ms panel transitions, density controls from electron-viz prototype
