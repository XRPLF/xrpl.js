import {
  decodeAccountID,
  encodeAccountID,
  isValidXAddress,
  xAddressToClassicAddress,
} from 'ripple-address-codec'
import { Hash160 } from './hash-160'
import { Buffer } from 'buffer/'

const HEX_REGEX = /^[A-F0-9]{40}$/

/**
 * Class defining how to encode and decode an AccountID
 */
class AccountID extends Hash160 {
  static readonly defaultAccountID: AccountID = new AccountID(Buffer.alloc(20))

  constructor(bytes?: Buffer) {
    super(bytes ?? AccountID.defaultAccountID.bytes)
  }

  /**
   * Defines how to construct an AccountID
   *
   * @param value either an existing AccountID, a hex-string, or a base58 r-Address
   * @returns an AccountID object
   */
  static from<T extends Hash160 | string>(value: T): AccountID {
    if (value instanceof AccountID) {
      return value
    }

    if (typeof value === 'string') {
      if (value === '') {
        return new AccountID()
      }

      return HEX_REGEX.test(value)
        ? new AccountID(Buffer.from(value, 'hex'))
        : this.fromBase58(value)
    }

    throw new Error('Cannot construct AccountID from value given')
  }

  /**
   * Defines how to build an AccountID from a base58 r-Address
   *
   * @param value a base58 r-Address
   * @returns an AccountID object
   */
  static fromBase58(value: string): AccountID {
    if (isValidXAddress(value)) {
      const classic = xAddressToClassicAddress(value)

      if (classic.tag !== false)
        throw new Error('Only allowed to have tag on Account or Destination')

      value = classic.classicAddress
    }

    return new AccountID(Buffer.from(decodeAccountID(value)))
  }

  /**
   * Overload of toJSON
   *
   * @returns the base58 string for this AccountID
   */
  toJSON(): string {
    return this.toBase58()
  }

  /**
   * Defines how to encode AccountID into a base58 address
   *
   * @returns the base58 string defined by this.bytes
   */
  toBase58(): string {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return encodeAccountID(this.bytes as any)
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }
}

export { AccountID }
