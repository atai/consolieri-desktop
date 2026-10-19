export interface WorkspaceTabRecord<P = unknown> {
    id: string;
    hostId: string | null;
    title: string;
    layout: unknown;
    panes: P[];
}
export interface WorkspaceTabsRecord<P = unknown> {
    tabs: WorkspaceTabRecord<P>[];
    activeTabId: string | null;
}
export declare function migrateWorkspaceState<P = unknown>(raw: unknown, createId: () => string): WorkspaceTabsRecord<P>;
