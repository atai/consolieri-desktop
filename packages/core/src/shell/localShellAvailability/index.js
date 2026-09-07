import { isPowerShellAvailable } from './checkers/powershell';
import { isPwshAvailable } from './checkers/pwsh';
import { isCmdAvailable } from './checkers/cmd';
import { isBashAvailable } from './checkers/bash';
import { isZshAvailable } from './checkers/zsh';
import { isShAvailable } from './checkers/sh';
export function getLocalShellAvailability(deps) {
    return {
        powershell: isPowerShellAvailable(deps),
        pwsh: isPwshAvailable(deps),
        cmd: isCmdAvailable(deps),
        bash: isBashAvailable(deps),
        zsh: isZshAvailable(deps),
        sh: isShAvailable(deps)
    };
}
export function isLocalShellExecutableAvailable(shell, deps) {
    return getLocalShellAvailability(deps)[shell];
}
