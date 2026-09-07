/** Escape a value for safe use inside single-quoted POSIX shell arguments. */
export declare function shellEscapeSingleQuoted(value: string): string;
/** Remote shell script to append a public key to authorized_keys idempotently. */
export declare function buildAuthorizedKeysInstallCommand(pubkeyLine: string): string;
