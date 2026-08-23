# Consolieri Design System

> Category: Project Design System  
> Surface: desktop Electron app (Windows primary)

Consolieri is a professional SSH host manager, terminal multiplexer, and infrastructure visualization tool for DevOps engineers. This design system captures the production dark UI from v0.4.7 screenshots, terminal session chrome, network-map surfaces, and the electron-viz density prototype.

## Product Context

Consolieri is a Windows-first Electron desktop app (v0.4.7) for SSH host management, terminal multiplexing, connectivity reports, and network topology visualization. Target users are DevOps and platform engineers managing large host fleets. Source evidence: seven production screenshots and the `electron-viz-multi-screen.html` density prototype from Open Design project `eff54ab4-aed5-4420-b27a-179fa6c1cedb`.

## 1. Visual Theme & Atmosphere

**Mood:** Technical, high-contrast, utility-first. The product feels like a power tool — dense data, minimal decoration, color reserved for status and primary actions.

**Context:** Users manage hundreds of hosts, SSH keys, connection profiles, terminal splits, connectivity reports, and network topology maps. The UI must stay readable under information overload.

**Dual evidence:**
- **Production (screenshots):** Near-black charcoal canvas, electric-blue primary actions, orange tab indicators, orange hexagon brand mark.
- **Visualization prototype (`electron-viz-multi-screen.html`):** Light theme exploring density controls, hierarchical tables (10k–100k rows), KPI cards, and chart readability.

Default to the **dark production theme** for new Consolieri surfaces. Use the light prototype tokens only when explicitly building visualization/density experiments.

## 2. Color

### Dark production palette

| Token | Role |
|-------|------|
| `--consoleri-bg` | App canvas, terminal backdrop |
| `--consoleri-surface` | Cards, list rows, modals |
| `--consoleri-surface-raised` | Connection panel, modal chrome |
| `--consoleri-fg` | Primary text, host names |
| `--consoleri-muted` | Metadata, paths, fingerprints |
| `--consoleri-border` | Dividers, input outlines |
| `--consoleri-accent` | Primary buttons, active sidebar, links |
| `--consoleri-brand` | Logo hexagon, brand moments |
| `--consoleri-tab-active` | Active tab top/bottom indicator (orange) |
| `--consoleri-success` | OK status, healthy hosts |
| `--consoleri-danger` | FAIL status, delete actions |
| `--consoleri-warn` | Terminal selection border, caution |

### Terminal ANSI mapping

- Prompt user@host: green (`--consoleri-terminal-prompt`)
- Directory listings: cyan-blue (`--consoleri-terminal-path`)
- Selection/highlight border: gold (`--consoleri-terminal-selection`)

### Light prototype palette

Use `--consoleri-light-*` tokens from `electron-viz-multi-screen.html` when building density/table visualization experiments.

## 3. Typography

| Role | Stack | Size | Weight |
|------|-------|------|--------|
| App title | `--consoleri-font-sans` | 22–28px | 600–700 |
| Section header | sans | 16–18px | 600 |
| Body / list | sans | 13–14px | 400–500 |
| Metadata | sans | 12px | 400, muted color |
| Table headers | mono | 12px | 700, uppercase |
| Paths, fingerprints, KPIs | mono | 12–13px | tabular-nums |
| Terminal | mono | 13px | regular |

**Rules:** Host names and profile titles use semibold white. Comma-separated host lists stay regular muted grey. Section labels like `CONNECT` and `CONNECTION PROFILES` are uppercase, small, and accent-colored.

## 4. Spacing

Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 px.

| Context | Rhythm |
|---------|--------|
| Sidebar icon stack | 8px gap, 52px rail width |
| List row padding | 10–12px vertical, 12–16px horizontal |
| Card internal | 14–16px |
| Connection panel | 16–20px, min-height 240px |
| Table row height | 34px default, 28px dense mode |

**Radius:** 6px inputs/buttons, 10px cards, 14px modals, 999px pills/chips.

## 5. Layout & Composition

### App shell

```
┌─────────────────────────────────────────────┐
│ Title bar (Consolieri + window controls)      │
├─┬───────────────────────────────────────────┤
│█│ Tab bar: Hosts | Profiles | Keys          │
│█├───────────────────────────────────────────┤
│█│ Toolbar (search, filters, primary CTA)    │
│█│ Main list / map / report workspace        │
│█│                                           │
│█│ ┌─ Connection panel (slide-up) ─────────┐ │
│█│ │ CONNECT · host · profiles · actions  │ │
│█└─┴─────────────────────────────────────────┘
```

### Key surfaces

1. **Icon sidebar** — 52px rail; active item gets solid blue square background.
2. **Tab navigation** — centered text tabs; orange 2px line on active tab.
3. **Host list** — tag-grouped rows with avatar, hostname, domain, sub-tags, group count.
4. **Connection panel** — bottom sheet with profile rows and per-row Run/Edit/Delete icons.
5. **Terminal window** — custom title bar, layout toggles (Side by side / Top & bottom), gold border on active layout.
6. **Network map** — dark canvas, blue node headers, colored status dots, minimap bottom-right.
7. **Reports modal** — data table with OK/FAIL semantic colors, export toolbar.

### Density controls (prototype)

Row height slider, hierarchy toggle, KPI priority — preserve from `electron-viz-multi-screen.html`.

## 6. Components

### Buttons

- **Primary:** solid `--consoleri-accent`, white label, 10–14px padding, radius 6–10px. Examples: `+ Host`, `+ Add profile`, `Generate`.
- **Secondary:** dark fill + border, grey text. Examples: `Assign host`, `Deploy`, `Copy text`.
- **Ghost:** text-only, muted. Example: `Refresh`.
- **Destructive:** red text link, no fill. Example: `Delete`.

### Navigation

- **Sidebar icon button:** 36–40px hit target, blue fill when active.
- **Tab:** uppercase optional; orange top border when active.
- **Filter chips:** `None`, `Tag`, `OS`, `A-Z` — active chip gets blue text/fill.

### Lists & tables

- Group headers: `#TAG NAME` with count pill right-aligned.
- Host row: avatar (32px), bold name, grey FQDN, inline tag chips.
- Profile row: title + protocol badge (`SSH`, `RDP`) + comma-separated host list.
- Report table: HOST, PROFILE, STATUS, COMMANDS, DURATION, DETAILS columns.

### Status

- **OK:** green text, no background required.
- **FAIL:** red text.
- **Protocol badge:** grey pill, white text, 11–12px.

### Forms

- Search: full-width, dark inset field, placeholder muted.
- Dropdown: `Host filter` / `All profiles` pattern.
- Checkbox: `Open log on connect` with Normal verbosity label.

### Modals

- Dark title bar with window controls.
- Toolbar row: ghost copy buttons + primary `Generate`.
- Rounded 10–14px container, elevated shadow.

### Network map nodes

- Blue header strip with hostname.
- Dark body with status dot (red/green/purple/orange/blue).
- Thin grey connector lines; blue lines for highlighted paths.

## 7. Motion & Interaction

- **Hover:** subtle background lift on list rows (`color-mix` 4–6% foreground).
- **Active tab/sidebar:** immediate color swap, no animation.
- **Connection panel:** slide-up from bottom, 200ms ease-out.
- **Switch toggle:** 160ms thumb slide (`cubic-bezier(0.23, 1, 0.32, 1)`).
- **Terminal layout toggle:** gold border appears instantly on selection.
- **Reduced motion:** disable transitions; keep state changes visible.

## 8. Voice & Brand

- **Product name:** Consolieri (never "Console" alone).
- **Tone:** Direct, technical, no marketing fluff.
- **Labels:** Short imperatives — `Connect`, `Refresh`, `Run`, `Deploy`.
- **Section headers:** Uppercase for workflow stages (`CONNECT`, `CONNECTION PROFILES`, `SSH Keys`).
- **Version:** Display `v0.4.7` bottom-left of sidebar when space allows.
- **Languages:** UI copy in screenshots is English; prototype includes Russian labels — match the target locale consistently per surface.

## 9. Anti-patterns

- Purple gradient washes or generic SaaS palettes.
- Light theme by default (production is dark).
- Rounded cards with left color-border accents.
- Emoji as feature icons.
- Fake metrics or invented host counts.
- Low-density marketing layouts for data-heavy screens.
- Hiding hierarchy in 10k+ row tables.
- Inter/Roboto as display faces (system sans is fine for body).
- Hot-linking screenshot URLs — use `assets/screenshots/` paths.
- Replacing real screenshots with placeholder wireframes in review cards.
- Inventing alternate logo glyphs (network wireframes, C-stroke hex, 3D cubes) — only the locked hexagon+aperture mark may ship.

## Brand assets

**Locked mark (do not invent variants):** flat pointy-top hexagon `#f59e0b` with a circular center aperture on ink `#0c141f`. Same polygon + mask geometry in every file. Rebuild rasters with `node assets/_brand/rebuild-rasters.cjs` — never regenerate PNGs with unrelated AI motifs (no network wireframes, no C-stroke hex, no 3D cube glyphs).

| Asset | Path | Use |
|-------|------|-----|
| Color logo | `assets/logo.svg` | Title bar, about, docs |
| Mono logo | `assets/logo-mono.svg` | Light-on-dark mono |
| Tile logo | `assets/logo-on-dark.svg` | Rounded app tile SVG |
| Wordmark | `assets/wordmark.svg` | Lockups (tile + Consolieri) |
| Logo render | `assets/logo-mark.png` | Same mark, soft shadow on dark |
| App icon | `assets/icons/app-icon.png` · `build/icons/icon.png` | Electron app icon |
| Tray | `assets/icons/tray-icon.png` · `.svg` · `build/icons/tray.png` | System tray |
| Store tile | `assets/icons/store-tile.png` | Installer / store |
| Sidebar icons | `assets/icons/sidebar-*.svg` | Hosts, Profiles, Network, Settings |
| Empty states | `assets/illustrations/empty-*.png` | Hosts / Keys / Network (mark reused) |
| Splash & hero | `assets/marketing/` | Splash, about, hero, wordmark PNG |

## Source evidence

- `assets/screenshots/image.png` – `image-6.png` — production UI captures (title-bar hexagon+aperture mark)
- `source_examples/electron-viz-multi-screen.html` — density/visualization prototype
- `assets/_brand/rebuild-rasters.cjs` — single-source raster rebuild for all PNG brand files
