import { Hash160 } from "./hash-160";
import { Buffer } from "buffer/";

const ISO_REGEX = /^[A-Z0-9]{3}$/;
const HEX_REGEX = /^[A-F0-9]{40}$/;

/**
 * Convert an ISO code to a currency bytes representation
 */
function isoToBytes(iso: string): Buffer {
  const bytes = Buffer.alloc(20);
  if (iso !== "XRP") {
    const isoBytes = iso.split("").map((c) => c.charCodeAt(0));
    bytes.set(isoBytes, 12);
  }
  return bytes;
}

/**
 * Tests if ISO is a valid iso code
 */
function isIsoCode(iso: string): boolean {
  return iso.length === 3;
}

/**
 * Tests if hex is a valid hex-string
 */
function isHex(hex: string): boolean {
  return HEX_REGEX.test(hex);
}

/**
 * Tests if a string is a valid representation of a currency
 */
function isStringRepresentation(input: string): boolean {
  return isIsoCode(input) || isHex(input);
}

/**
 * Tests if a Buffer is a valid representation of a currency
 */
function isBytesArray(bytes: Buffer): boolean {
  return bytes.byteLength === 20;
}

/**
 * Ensures that a value is a valid representation of a currency
 */
function isValidRepresentation(input: Buffer | string): boolean {
  return input instanceof Buffer
    ? isBytesArray(input)
    : isStringRepresentation(input);
}

/**
 * Generate bytes from a string or buffer representation of a currency
 */
function bytesFromRepresentation(input: string): Buffer {
  if (!isValidRepresentation(input)) {
    throw new Error(`Unsupported Currency representation: ${input}`);
  }
  return input.length === 3 ? isoToBytes(input) : Buffer.from(input, "hex");
}

/**
 * Class defining how to encode and decode Currencies
 */
class Currency extends Hash160 {
  static readonly XRP = new Currency(Buffer.alloc(20));
  private readonly _iso?: string;
  private readonly _isNative: boolean;

  constructor(byteBuf: Buffer) {
    super(byteBuf ?? Currency.XRP.bytes);

    let onlyISO = true;

    const bytes = this.bytes;
    const code = this.bytes.slice(12, 15);
    const iso = code.toString();

    for (let i = bytes.length - 1; i >= 0; i--) {
      if (bytes[i] !== 0 && !(i === 12 || i === 13 || i === 14)) {
        onlyISO = false;
        break;
      }
    }

    const lossLessISO = onlyISO && iso !== "XRP" && ISO_REGEX.test(iso);
    this._isNative = onlyISO && code.toString("hex") === "000000";
    this._iso = this._isNative ? "XRP" : lossLessISO ? iso : undefined;
  }

  /**
   * Tells if this currency is native
   *
   * @returns true if native, false if not
   */
  isNative(): boolean {
    return this._isNative;
  }

  /**
   * Return the ISO code of this currency
   *
   * @returns ISO code if it exists, else undefined
   */
  iso(): string | undefined {
    return this._iso;
  }

  /**
   * Constructs a Currency object
   *
   * @param val Currency object or a string representation of a currency
   */
  static from<T extends Hash160 | string>(value: T): Currency {
    if (value instanceof Currency) {
      return value;
    }

    if (typeof value === "string") {
      return new Currency(bytesFromRepresentation(value));
    }

    throw new Error("Cannot construct Currency from value given");
  }

  /**
   * Gets the JSON representation of a currency
   *
   * @returns JSON representation
   */
  toJSON(): string {
    const iso = this.iso();
    if (iso !== undefined) {
      return iso;
    }
    return this.bytes.toString("hex").toUpperCase();
  }
}

export { Currency };
