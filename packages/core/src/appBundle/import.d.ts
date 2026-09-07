import type { AppExportDocument } from './types';
export declare function isAppExportDocument(input: unknown): input is AppExportDocument;
export declare function parseAppImportJson(json: string): AppExportDocument;
export declare function normalizeAppExportDocument(input: unknown): AppExportDocument;
