/** Platform-agnostic modifier: Ctrl on Win/Linux, Cmd (Meta) on macOS. */
export interface Accelerator {
    key: string;
    mod?: boolean;
    ctrl?: boolean;
    meta?: boolean;
    alt?: boolean;
    shift?: boolean;
}
export type KeybindingId = 'toggleMaximizePane';
export type Keybindings = Partial<Record<KeybindingId, Accelerator>>;
export declare const KEYBINDING_IDS: KeybindingId[];
export declare const KEYBINDING_LABELS: Record<KeybindingId, string>;
