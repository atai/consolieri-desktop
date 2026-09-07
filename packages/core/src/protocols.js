export function isTerminalProtocol(protocol) {
    return protocol === 'ssh' || protocol === 'local_pty' || protocol === 'wsl';
}
export function defaultPortForProtocol(protocol) {
    switch (protocol) {
        case 'rdp':
            return 3389;
        case 'vnc':
            return 5900;
        case 'ssh':
        default:
            return 22;
    }
}
