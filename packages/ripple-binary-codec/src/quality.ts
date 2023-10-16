import { coreTypes } from './types'
import BigNumber from 'bignumber.js'
import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/utils'

/**
 * class for encoding and decoding quality
 */
class quality {
  /**
   * Encode quality amount
   *
   * @param arg string representation of an amount
   * @returns Serialized quality
   */
  static encode(quality: string): Uint8Array {
    const decimal = BigNumber(quality)
    const exponent = (decimal?.e || 0) - 15
    const qualityString = decimal.times(`1e${-exponent}`).abs().toString()
    const bytes = coreTypes.UInt64.from(BigInt(qualityString)).toBytes()
    bytes[0] = exponent + 100
    return bytes
  }

  /**
   * Decode quality amount
   *
   * @param arg hex-string denoting serialized quality
   * @returns deserialized quality
   */
  static decode(quality: string): BigNumber {
    const bytes = hexToBytes(quality).slice(-8)
    const exponent = bytes[0] - 100
    const mantissa = new BigNumber(`0x${bytesToHex(bytes.slice(1))}`)
    return mantissa.times(`1e${exponent}`)
  }
}

export { quality }
