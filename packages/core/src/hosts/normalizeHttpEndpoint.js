export function normalizeHttpEndpoint(value) {
    if (value == null)
        return null;
    const trimmed = value.trim();
    if (!trimmed)
        return null;
    let url;
    try {
        url = new URL(trimmed);
    }
    catch {
        throw new Error('HTTP endpoint must be a valid http(s) URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('HTTP endpoint must be a valid http(s) URL');
    }
    return url.toString();
}
