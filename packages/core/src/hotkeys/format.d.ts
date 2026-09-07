import type { Accelerator } from './types';
import { type HotkeyPlatform } from './match';
/** Human-readable accelerator for UI (mac uses symbols, others use Ctrl/Alt/Shift). */
export declare function formatAccelerator(accel: Accelerator, platform?: HotkeyPlatform): string;
