/**
 * Convert a UInt8Array to hex. The returned hex will be in all caps.
 *
 * @param bytes - {Uint8Array} to convert to hex
 */
export declare function BytesToHexFn(bytes: Uint8Array | number[]): string

/**
 * Convert hex to a Uint8Array.
 *
 * @param hex - {string} to convert to a Uint8Array
 */
export declare function HexToBytesFn(hex: string): Uint8Array

/**
 * Create a Uint8Array of the supplied size.
 *
 * @param size - number of bytes to generate
 */
export declare function RandomBytesFn(size: number): Uint8Array
