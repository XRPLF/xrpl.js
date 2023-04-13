import * as assert from 'assert'
// TODO
// eslint-disable-next-line import/no-extraneous-dependencies
import { ripemd160 } from '@noble/hashes/ripemd160'
// TODO
// eslint-disable-next-line import/no-extraneous-dependencies
import { sha256 } from '@noble/hashes/sha256'
import { hexToBytes as nobleHexToBytes} from "@noble/curves/abstract/utils";

function bytesToHex(a: Iterable<number> | ArrayLike<number>): string {
  return Array.from(a, (byteValue) => {
    const hex = byteValue.toString(16).toUpperCase()
    return hex.length > 1 ? hex : `0${hex}`
  }).join('')
}

function hexToBytes(a: string): number[] {
  assert.ok(a.length % 2 === 0)
  return Array.from(nobleHexToBytes(a))
}

function computePublicKeyHash(publicKeyBytes: Buffer): Buffer {
  const hash256 = sha256(publicKeyBytes)
  const hash160 = ripemd160(hash256)
  return Buffer.from(hash160)
}

export { bytesToHex, hexToBytes, computePublicKeyHash }
