import {
  bytesToHex as nobleBytesToHex,
  hexToBytes as nobleHexToBytes,
  randomBytes as nobleRandomBytes,
} from '@noble/hashes/utils'
import { Utils } from './types'

const utils: Utils = {
  bytesToHex(bytes) {
    const hex = nobleBytesToHex(
      bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes),
    )
    return hex.toUpperCase()
  },
  hexToBytes: nobleHexToBytes,
  randomBytes: nobleRandomBytes,
}

export const { bytesToHex, hexToBytes, randomBytes } = utils
