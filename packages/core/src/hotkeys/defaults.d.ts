import type { Accelerator, KeybindingId, Keybindings } from './types';
export declare const DEFAULT_KEYBINDINGS: Record<KeybindingId, Accelerator>;
export declare function mergeKeybindings(partial?: Keybindings | null): Record<KeybindingId, Accelerator>;
