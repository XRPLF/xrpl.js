import * as assert from 'assert'
import * as hashjs from 'hash.js'
import * as BN from 'bn.js'

function bytesToHex(a): string {
  return a
    .map((byteValue) => {
      const hex = byteValue.toString(16).toUpperCase()
      return hex.length > 1 ? hex : `0${hex}`
    })
    .join('')
}

function hexToBytes(a): number[] {
  assert.ok(a.length % 2 === 0)
  return new BN(a, 16).toArray(null, a.length / 2)
}

function computePublicKeyHash(publicKeyBytes: Buffer): Buffer {
  const hash256 = hashjs.sha256().update(publicKeyBytes).digest()

  const hash160 = hashjs.ripemd160().update(hash256).digest()
  return Buffer.from(hash160)
}

export { bytesToHex, hexToBytes, computePublicKeyHash }
