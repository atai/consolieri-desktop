/** Inset from the viewport edge, and the gap under the toolbar button. */
export const TOOLBAR_MENU_MARGIN = 4

/**
 * Horizontal position of a toolbar menu. Prefers aligning the menu's right edge
 * with the button. If that crosses the left edge, aligns to the button's left.
 * If the menu still does not fit, shifts it inside the viewport.
 */
export function placeToolbarMenu(
  anchor: { left: number; right: number },
  menuWidth: number,
  viewportWidth: number
): number {
  let left = anchor.right - menuWidth
  if (left < TOOLBAR_MENU_MARGIN) left = anchor.left
  const maxLeft = viewportWidth - TOOLBAR_MENU_MARGIN - menuWidth
  if (left > maxLeft) left = Math.max(TOOLBAR_MENU_MARGIN, maxLeft)
  return left
}
