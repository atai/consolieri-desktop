export function parseTagsInput(value) {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
}
export function getActiveTagToken(value) {
    const lastComma = value.lastIndexOf(',');
    if (lastComma === -1)
        return value;
    return value.slice(lastComma + 1);
}
export function applyTagSuggestion(value, tag) {
    const lastComma = value.lastIndexOf(',');
    if (lastComma === -1) {
        return `${tag}, `;
    }
    const head = value.slice(0, lastComma).trimEnd();
    return `${head}, ${tag}, `;
}
export function suggestHostTags(existingTags, query, alreadySelected, limit = 8) {
    const q = query.trim().toLowerCase();
    if (!q)
        return [];
    const selected = new Set(alreadySelected.map((tag) => tag.toLowerCase()));
    const seen = new Set();
    return existingTags
        .filter((tag) => {
        const key = tag.toLowerCase();
        if (selected.has(key) || seen.has(key))
            return false;
        seen.add(key);
        return tag.toLowerCase().includes(q);
    })
        .sort((a, b) => {
        const aLow = a.toLowerCase();
        const bLow = b.toLowerCase();
        const aStarts = aLow.startsWith(q);
        const bStarts = bLow.startsWith(q);
        if (aStarts !== bStarts)
            return aStarts ? -1 : 1;
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
    })
        .slice(0, limit);
}
