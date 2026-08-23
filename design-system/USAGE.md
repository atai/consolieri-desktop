# Consolieri Design System Usage

Agent-facing package guide for Open Design and Consolieri app work.

## Read Order

1. Read this file first to understand the package contract.
2. Read `DESIGN.md` for visual intent, constraints, and anti-patterns.
3. Import or paste `tokens.css` before writing component CSS; load `tokens.app-extensions.css` for desktop chrome / terminal extensions.
4. For Tailwind v4 apps, import `tailwind-v4.css` (derived from `tokens.css`) — do not hand-author a parallel `@theme`.
5. Inspect `preview/` and `ui_kits/app/` when layout fidelity matters.
6. Read `BRAND.md` / `brand.json` only for logo lockup and Design System tab metadata.

## Design Highlights

- Dark production canvas (`--bg` ≈ `#0c141f`), electric-blue primary (`--accent` ≈ `#2b7fff`), amber brand / active tab (`--brand` / `--tab-active`).
- System sans for UI; JetBrains Mono for paths, fingerprints, terminal, dense tables.
- 52px icon sidebar, centered tabs with orange indicator, bottom connection panel.
- Color reserved for status and primary actions — utility-first density.

## Do

- Keep Open Design charter token names (`--bg`, `--surface`, `--fg`, `--accent`, …) as the primary bindings in `tokens.css`.
- Use semantic Tailwind utilities from `tailwind-v4.css` (`bg-bg`, `bg-surface`, `text-muted`, `bg-accent`) in the Electron app.
- Put product-only tokens (sidebar width, terminal ANSI, tab-active) in `tokens.app-extensions.css` so a full OD re-export does not wipe them.
- Prefer `components/ui` primitives in the app over inventing per-page palettes.

## Avoid

- Avoid raw hex outside `tokens.css` / hex-reference vars.
- Avoid redefining Tailwind `@theme` values in `apps/desktop` independently of `tailwind-v4.css`.
- Avoid treating `brand.json` or `colors_and_type.css` as a second runtime source of truth (`colors_and_type.css` is a legacy shim).
- Avoid inventing alternate logo marks or purple SaaS gradients (see `BRAND.md` / `DESIGN.md` anti-patterns).
