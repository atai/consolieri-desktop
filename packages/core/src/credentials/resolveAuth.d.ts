export type AuthMaterialType = 'password' | 'privateKey' | 'none';
export declare function authTypeFromCredentialRef(credentialRef: string | null): AuthMaterialType;
export declare function applyAuthToConnectConfig(credentialRef: string | null, secret: string | null): {
    password?: string;
    privateKey?: string;
};
