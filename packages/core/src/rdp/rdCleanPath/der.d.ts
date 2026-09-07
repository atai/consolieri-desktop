declare const TAG_SEQUENCE = 48;
declare const TAG_INTEGER = 2;
declare const TAG_OCTET_STRING = 4;
declare const TAG_UTF8STRING = 12;
declare function tagContext(n: number): number;
export declare function derEncodeLength(length: number): Buffer;
export declare function derWrap(tag: number, content: Buffer): Buffer;
export declare function derEncodeInteger(value: number): Buffer;
export declare function derEncodeUtf8String(str: string): Buffer;
export declare function derEncodeOctetString(buf: Buffer): Buffer;
export declare function derWrapContext(tagNum: number, content: Buffer): Buffer;
export interface DerTLV {
    tag: number;
    value: Buffer;
    totalLength: number;
}
export declare function derDecodeLength(buf: Buffer, offset: number): {
    length: number;
    bytesRead: number;
};
export declare function derDecodeTLV(buf: Buffer, offset: number): DerTLV;
export declare function derDecodeInteger(buf: Buffer): number;
export declare function derDecodeChildren(buf: Buffer): DerTLV[];
export { TAG_SEQUENCE, TAG_INTEGER, TAG_OCTET_STRING, TAG_UTF8STRING, tagContext };
