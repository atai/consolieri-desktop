export declare function parseTagsInput(value: string): string[];
export declare function getActiveTagToken(value: string): string;
export declare function applyTagSuggestion(value: string, tag: string): string;
export declare function suggestHostTags(existingTags: string[], query: string, alreadySelected: string[], limit?: number): string[];
