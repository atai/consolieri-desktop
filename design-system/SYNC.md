# Syncing Open Design → Consoleri

## Ownership

| Path | Owner | On OD re-export |
|------|--------|-----------------|
| `tokens.css` | Open Design / design author | Overwrite OK |
| `tailwind-v4.css` | Derived from `tokens.css` | Regenerate / overwrite OK |
| `DESIGN.md`, `USAGE.md`, `manifest.json`, `preview/` | Design package | Overwrite OK (merge prose carefully) |
| `tokens.app-extensions.css` | Consoleri app | **Do not overwrite** — merge C-extensions manually |
| `apps/desktop/.../app.css` overlays | App | Never part of OD export |

## After a re-export

1. Diff `tokens.css`, `tailwind-v4.css`, `DESIGN.md`, `preview/`.
2. Ensure charter slots (`--bg`, `--accent`, …) still match product intent.
3. Re-check `tokens.app-extensions.css` aliases still point at living charter vars.
4. Rebuild desktop — chrome should follow tokens without app palette edits.
5. If patterns (not colors) changed, update `apps/desktop` `components/ui` only.
