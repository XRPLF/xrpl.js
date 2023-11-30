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

/**
 * Converts hex to its string equivalent. Useful to read the Domain field and some Memos.
 *
 * @param hex - The hex to convert to a string.
 * @param encoding - The encoding to use. Defaults to 'utf8' (UTF-8). 'ascii' is also allowed.
 * @returns The converted string.
 */
export declare function HexToStringFn(hex: string, encoding?: string): string

/**
 * Converts a utf-8 to its hex equivalent. Useful for Memos.
 *
 * @param string - The string to convert to Hex.
 * @returns The Hex equivalent of the string.
 */
export declare function StringToHexFn(string: string): string
