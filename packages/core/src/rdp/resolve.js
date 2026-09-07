import { defaultPortForProtocol } from '../protocols';
import { DEFAULT_RDP_MIN_HEIGHT, DEFAULT_RDP_MIN_WIDTH } from './constants';
import { parseDestination } from './rdCleanPath/destination';
export function resolveRdpPort(extra, fallback = defaultPortForProtocol('rdp')) {
    const port = extra?.rdpPort;
    if (typeof port === 'number' && Number.isFinite(port) && port > 0 && port <= 65535) {
        return port;
    }
    return fallback;
}
export function buildRdpDestination(hostname, port) {
    if (hostname.includes(':') && !hostname.startsWith('[')) {
        return `[${hostname}]:${port}`;
    }
    return `${hostname}:${port}`;
}
export function normalizeDesktopSize(width, height, minimums = {
    width: DEFAULT_RDP_MIN_WIDTH,
    height: DEFAULT_RDP_MIN_HEIGHT
}) {
    return {
        width: Math.max(Math.floor(width), minimums.width),
        height: Math.max(Math.floor(height), minimums.height)
    };
}
function normalizeHostForCompare(host) {
    const trimmed = host.trim().toLowerCase();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}
export function destinationsMatch(requested, allowedHost, allowedPort) {
    const parsed = parseDestination(requested);
    return (normalizeHostForCompare(parsed.host) === normalizeHostForCompare(allowedHost) &&
        parsed.port === allowedPort);
}
export function assertAllowedDestination(requested, allowedHost, allowedPort) {
    if (!destinationsMatch(requested, allowedHost, allowedPort)) {
        throw new Error(`RDP destination not allowed: ${requested} (expected ${buildRdpDestination(allowedHost, allowedPort)})`);
    }
}
