import { createBuiltinUxProfile } from './defaults';
export function resolveUxProfile(profiles, options = {}) {
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));
    const builtin = profiles.find((profile) => profile.isBuiltin) ?? createBuiltinUxProfile();
    if (options.hostUxProfileId) {
        const hostProfile = byId.get(options.hostUxProfileId);
        if (hostProfile)
            return hostProfile;
    }
    if (options.activeUxProfileId) {
        const active = byId.get(options.activeUxProfileId);
        if (active)
            return active;
    }
    return builtin;
}
