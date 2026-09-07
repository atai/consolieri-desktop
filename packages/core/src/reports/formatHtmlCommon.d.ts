import type { HttpStatusTone } from './httpStatusColor';
export declare function escapeHtml(text: string): string;
export declare function statusCssClass(status: string): string;
export declare function httpStatusCssClass(tone: HttpStatusTone): string;
export declare function htmlPreBlock(text: string): string;
export declare function htmlSection(title: string, content: string): string;
export declare function wrapReportHtml(title: string, meta: string, body: string): string;
