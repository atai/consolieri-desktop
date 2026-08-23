# Consolieri UI Kit

Applied interface kit for **Consolieri** — the dark production Electron shell for SSH host management, connection profiles, keys, reports, and network maps. Built from v0.4.7 screenshot evidence and the Consolieri design-system tokens.

## Source

Based on Consolieri v0.4.7 production screenshots (`assets/screenshots/`) and tokens from `tokens.css` / `DESIGN.md`. Density/table experiments may additionally reference `source_examples/electron-viz-multi-screen.html`.

## Structure

- `index.html` — runnable React 18 + Babel entry that mounts the composed shell
- `components/` — modular JSX files exported on `window` for shared Babel scopes
- Brand assets live at `../../assets/` (logos, sidebar icons, empty states, avatars)
- Packaging icons live at `../../build/icons/`

## Components

| File | Role |
|------|------|
| `components/App.jsx` | Shell: title bar, sidebar, tabs, host list, connection panel |
| `components/Sidebar.jsx` | 52px icon rail with SVG icons from `assets/icons/sidebar-*.svg` |
| `components/TabBar.jsx` | Hosts / Profiles / Keys with orange active indicator |
| `components/HostList.jsx` | Tag-grouped hosts with avatars and chips |
| `components/ConnectionPanel.jsx` | Bottom sheet: profiles with Run / Edit / Delete |
| `components/StatusBadge.jsx` | OK / FAIL semantic status |

## Usage

1. Open `index.html` in the Design Files preview.
2. Import tokens: `<link rel="stylesheet" href="../../tokens.css" />` and `<link rel="stylesheet" href="../../tokens.app-extensions.css" />` (or the legacy shim `colors_and_type.css`).
3. Compose or copy `components/*.jsx` into new prototypes — each file assigns to `window` (e.g. `window.Sidebar`, `window.App`).
4. Use relative brand paths (`../../assets/logo.svg`, empty-state PNGs) — never hot-link.
5. Build new screens by extending `App.jsx` layout rather than inventing a second shell.

```html
<script type="text/babel" src="components/Sidebar.jsx"></script>
<script type="text/babel" src="components/TabBar.jsx"></script>
<script type="text/babel" src="components/HostList.jsx"></script>
<script type="text/babel" src="components/ConnectionPanel.jsx"></script>
<script type="text/babel" src="components/StatusBadge.jsx"></script>
<script type="text/babel" src="components/App.jsx"></script>
```

## Design Notes

- **Layout:** 52px sidebar, centered tabs, tag-grouped list, bottom connection panel.
- **Colors:** dark canvas `--consoleri-bg`, accent `--consoleri-accent` (#2b7fff), brand orange for logo/tab only.
- **Typography:** system sans for UI; mono for paths and fingerprints (`--consoleri-font-mono`).
- **Tokens:** always load `tokens.css` (+ extensions); do not introduce raw hex outside status/brand moments already documented.
- **Source fidelity:** match Hosts / Profiles / Network map screenshots before inventing new chrome.

## Brand assets to wire

| Need | Path |
|------|------|
| Logo | `../../assets/logo.svg` |
| Sidebar icons | `../../assets/icons/sidebar-*.svg` |
| Connect | `../../assets/icons/action-connect.svg` |
| Empty Hosts | `../../assets/illustrations/empty-hosts.png` |
| Avatars | `../../assets/illustrations/avatar-*.svg` |
| App icon | `../../build/icons/icon.png` |

## Anti-patterns

- Purple SaaS gradients or light theme as default
- Emoji as nav icons (use the SVG set)
- Invented host counts / fake metrics
- Hot-linking remote images
