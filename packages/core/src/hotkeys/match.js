export function detectHotkeyPlatform(platform = typeof process !== 'undefined' ? process.platform : 'other') {
    if (platform === 'darwin')
        return 'darwin';
    if (platform === 'win32')
        return 'win32';
    if (platform === 'linux')
        return 'linux';
    return 'other';
}
function normalizeKey(key) {
    if (key === ' ')
        return 'space';
    if (key.length === 1)
        return key.toLowerCase();
    return key.toLowerCase();
}
function expectedModKeys(accel, platform) {
    let ctrl = Boolean(accel.ctrl);
    let meta = Boolean(accel.meta);
    if (accel.mod) {
        if (platform === 'darwin')
            meta = true;
        else
            ctrl = true;
    }
    return {
        ctrl,
        meta,
        alt: Boolean(accel.alt),
        shift: Boolean(accel.shift)
    };
}
export function matchAccelerator(event, accel, platform = detectHotkeyPlatform()) {
    const expected = expectedModKeys(accel, platform);
    if (event.ctrlKey !== expected.ctrl)
        return false;
    if (event.metaKey !== expected.meta)
        return false;
    if (event.altKey !== expected.alt)
        return false;
    if (event.shiftKey !== expected.shift)
        return false;
    return normalizeKey(event.key) === normalizeKey(accel.key);
}
/** True when the binding collides with terminal copy/paste (Mod+Shift+C/V). */
export function conflictsWithClipboard(accel) {
    const key = normalizeKey(accel.key);
    if (key !== 'c' && key !== 'v')
        return false;
    if (!accel.shift)
        return false;
    return Boolean(accel.mod || accel.ctrl || accel.meta);
}
export function acceleratorFromKeyboardEvent(event, platform = detectHotkeyPlatform()) {
    const key = normalizeKey(event.key);
    if (key === 'control' ||
        key === 'meta' ||
        key === 'alt' ||
        key === 'shift' ||
        key === 'os') {
        return null;
    }
    const hasMod = event.ctrlKey || event.metaKey || event.altKey;
    if (!hasMod)
        return null;
    const accel = { key };
    if (platform === 'darwin') {
        if (event.metaKey)
            accel.mod = true;
        else if (event.ctrlKey)
            accel.ctrl = true;
    }
    else {
        if (event.ctrlKey)
            accel.mod = true;
        else if (event.metaKey)
            accel.meta = true;
    }
    if (event.altKey)
        accel.alt = true;
    if (event.shiftKey)
        accel.shift = true;
    return accel;
}
