import type { Accelerator } from './types';
export type HotkeyPlatform = 'darwin' | 'win32' | 'linux' | 'other';
export interface KeyEventLike {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
}
export declare function detectHotkeyPlatform(platform?: string): HotkeyPlatform;
export declare function matchAccelerator(event: KeyEventLike, accel: Accelerator, platform?: HotkeyPlatform): boolean;
/** True when the binding collides with terminal copy/paste (Mod+Shift+C/V). */
export declare function conflictsWithClipboard(accel: Accelerator): boolean;
export declare function acceleratorFromKeyboardEvent(event: KeyEventLike, platform?: HotkeyPlatform): Accelerator | null;
