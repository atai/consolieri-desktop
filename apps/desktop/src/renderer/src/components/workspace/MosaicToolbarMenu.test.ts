import { describe, expect, it } from 'vitest'
import { TOOLBAR_MENU_MARGIN, placeToolbarMenu } from './MosaicToolbarMenu'

const menuWidth = 160

describe('placeToolbarMenu', () => {
  it('keeps the menu inside the window when the button sits on the left edge', () => {
    const left = placeToolbarMenu({ left: 8, right: 72 }, menuWidth, 800)

    expect(left).toBeGreaterThanOrEqual(TOOLBAR_MENU_MARGIN)
    expect(left).toBe(8)
  })

  it('aligns the menu to the left of the button when the button sits on the right edge', () => {
    const anchor = { left: 700, right: 764 }
    const left = placeToolbarMenu(anchor, menuWidth, 800)

    expect(left).toBe(anchor.right - menuWidth)
    expect(left).toBeGreaterThanOrEqual(TOOLBAR_MENU_MARGIN)
    expect(left + menuWidth).toBeLessThanOrEqual(800 - TOOLBAR_MENU_MARGIN)
  })

  it('shifts the menu inside the window when neither alignment fits', () => {
    const viewportWidth = 200
    const wideMenu = 180
    const left = placeToolbarMenu({ left: 40, right: 80 }, wideMenu, viewportWidth)

    expect(left).toBeGreaterThanOrEqual(TOOLBAR_MENU_MARGIN)
    expect(left + wideMenu).toBeLessThanOrEqual(viewportWidth - TOOLBAR_MENU_MARGIN)
  })
})
