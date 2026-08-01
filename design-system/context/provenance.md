# Provenance

## Origin

| Field | Value |
|-------|-------|
| Source project ID | `eff54ab4-aed5-4420-b27a-179fa6c1cedb` |
| Source project name | Electron Приложение Нужно Улучшить Визуализацию - |
| Design system project ID | `a081a9c6-43dd-44df-a02d-03eff0e36e5b` |
| Design system ID | `user:electron-design-system` |
| Generated | 2026-07-29 |

## Evidence files

| File | Description |
|------|-------------|
| `image.png` | Hosts screen with connection panel |
| `image-1.png` | Profiles list |
| `image-2.png` | SSH Keys management |
| `image-3.png` | Terminal session (ConsoleZ) |
| `image-4.png` | Split-pane terminal (Consoleri) |
| `image-5.png` | Reports modal with OK/FAIL table |
| `image-6.png` | Network map visualization |
| `electron-viz-multi-screen.html` | Density/hierarchy visualization prototype |

## Token derivation

- Dark surfaces sampled from production screenshots (~`#0c141f` canvas, `#1a2332` panels)
- Primary accent: electric blue from active sidebar, buttons, links
- Tab indicator: orange from Hosts/Profiles/Keys active tab
- Brand mark: flat orange hexagon `#f59e0b` with circular center aperture on ink `#0c141f` (title-bar / Windows app icon evidence). Geometry locked in `assets/logo.svg`; all PNGs rebuild from `assets/_brand/rebuild-rasters.cjs`.
- Terminal colors: green prompt, cyan directories, gold selection border from terminal screenshots
- Light prototype tokens: extracted from `electron-viz-multi-screen.html` `:root` block

## Design System tab binding (2026-07-29)

The Design System inspector reads **`brand.json`**, not loose files under `assets/`. Without `logo.primary` / `imagery.samples`, the Logo and Images modules show empty even when PNGs/SVGs exist on disk. Wired:

- `brand.json` → `logos/primary.svg` + alternates + `imagery/*` samples
- `BRAND.md` — prose brand guide
- `logos/` / `imagery/` — mirrors of the canonical `assets/` masters

## Assets preserved

- `assets/screenshots/` — all 7 production screenshots copied byte-for-byte
- `source_examples/electron-viz-multi-screen.html` — density prototype

## Assets generated (rebuilt 2026-07-29 — consistency pass)

Previous AI-mixed brand PNGs (network wireframe marks, C-stroke lockups, unrelated 3D glyphs) were discarded. Every logo/icon/splash/empty-state PNG is now a raster of the same SVG mark geometry.

| Path | Role |
|------|------|
| `assets/logo.svg` | Canonical color mark (hexagon + aperture) |
| `assets/logo-mono.svg` / `logo-on-dark.svg` / `wordmark.svg` | Same geometry variants |
| `assets/logo-mark.png` | Same mark, soft shadow on dark |
| `assets/icons/app-icon.png` | Electron app icon (tile + mark) |
| `assets/icons/tray-icon.png` / `.svg` | Tray marks |
| `assets/icons/store-tile.png` | Store / installer tile |
| `assets/icons/sidebar-*.svg` | Sidebar navigation icons |
| `assets/icons/action-connect.svg` | Connect/play control |
| `assets/illustrations/empty-*.png` | Empty states reusing the mark |
| `assets/illustrations/host-avatars.png` + `avatar-*.svg` | Host avatars |
| `assets/marketing/*` | Splash, about, hero, wordmark lockup |
| `build/icons/*` | Packaging copies |
| `assets/_brand/rebuild-rasters.cjs` | Rebuild script |

## Not available in source

- Original font files (system sans + JetBrains Mono referenced in prototype only)
- Application source code (only HTML prototype artifact)
- High-res vector of the original Windows title-bar icon — mark reconstructed from screenshot crops
