import type { CustomTestCommand, CustomTestConfig, CustomTestResult } from './types';
export declare function normalizeCustomTestCommand(raw: unknown): CustomTestCommand | null;
export declare function normalizeCustomTestCommands(raw: unknown): CustomTestCommand[];
export declare function normalizeCustomTestConfig(input: unknown): CustomTestConfig;
export declare function normalizeCustomTestResult(input: unknown): CustomTestResult | null;
