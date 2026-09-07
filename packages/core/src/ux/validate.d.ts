import type { ChromeAppearance, TerminalAppearance, TerminalTheme, UxProfileInput, UxProfileSettings } from './types';
export declare function normalizeTerminalTheme(input: Partial<TerminalTheme> | undefined, base?: TerminalTheme): TerminalTheme;
export declare function normalizeTerminalAppearance(input: Partial<TerminalAppearance> | undefined): TerminalAppearance;
export declare function normalizeChromeAppearance(input: Partial<ChromeAppearance> | undefined): ChromeAppearance;
export declare function normalizeUxProfileSettings(input: Partial<UxProfileSettings> | undefined): UxProfileSettings;
export declare function normalizeUxProfileInput(input: UxProfileInput): UxProfileInput;
