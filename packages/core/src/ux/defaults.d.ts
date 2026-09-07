import type { ChromeAppearance, TerminalAppearance, TerminalTheme, UxProfile } from './types';
/** Aligned with design-system/hex.json terminal* keys. */
export declare const DEFAULT_TERMINAL_THEME: TerminalTheme;
export declare const DEFAULT_TERMINAL_APPEARANCE: TerminalAppearance;
export declare const MIN_SIDEBAR_WIDTH = 360;
export declare const MAX_SIDEBAR_WIDTH = 480;
export declare const DEFAULT_CHROME_APPEARANCE: ChromeAppearance;
export declare function createBuiltinUxProfile(now?: string): UxProfile;
