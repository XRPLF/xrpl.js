import type { Algorithm, HexString, KeyType } from '../types'

enum Prefix {
  NONE = -1,
  ED25519 = 0xed,
  SECP256K1_PUB_X = 0x02,
  SECP256K1_PUB_X_ODD_Y = 0x03,
  SECP256K1_PUB_XY = 0x04,
  SECP256K1_PRIVATE = 0x00,
}

type CompositeKey = `${KeyType}_${Prefix}_${number}`

/**
 * | Curve     | Type        | Prefix | Length | Description                                           | Algorithm       |
 * |-----------|-------------|:------:|:------:|-------------------------------------------------------|----------------:|
 * | ed25519   | Private     |  0xED  |   33   | prefix + Uint256LE (0 < n < order )                   |         ed25519 |
 * | ed25519   | Public      |  0xED  |   33   | prefix + 32 y-bytes                                   |         ed25519 |
 * | secp256k1 | Public (1)  |  0x02  |   33   | prefix + 32 x-bytes                                   | ecdsa-secp256k1 |
 * | secp256k1 | Public (2)  |  0x03  |   33   | prefix + 32 x-bytes (y is odd)                        | ecdsa-secp256k1 |
 * | secp256k1 | Public (3)  |  0x04  |   65   | prefix + 32 x-bytes + 32 y-bytes                      | ecdsa-secp256k1 |
 * | secp256k1 | Private (1) |  None  |   32   | Uint256BE (0 < n < order)                             | ecdsa-secp256k1 |
 * | secp256k1 | Private (2) |  0x00  |   33   | prefix + Uint256BE (0 < n < order)                    | ecdsa-secp256k1 |
 *
 * Note: The 0x00 prefix for secpk256k1 Private (2) essentially 0 pads the number
 *       and the interpreted number is the same as 32 bytes.
 */
const KEY_TYPES: Record<CompositeKey, Algorithm> = {
  [`private_${Prefix.NONE}_32`]: 'ecdsa-secp256k1',
  [`private_${Prefix.SECP256K1_PRIVATE}_33`]: 'ecdsa-secp256k1',
  [`private_${Prefix.ED25519}_33`]: 'ed25519',
  [`public_${Prefix.ED25519}_33`]: 'ed25519',
  [`public_${Prefix.SECP256K1_PUB_X}_33`]: 'ecdsa-secp256k1',
  [`public_${Prefix.SECP256K1_PUB_X_ODD_Y}_33`]: 'ecdsa-secp256k1',
  [`public_${Prefix.SECP256K1_PUB_XY}_65`]: 'ecdsa-secp256k1',
}

function getKeyInfo(key: HexString) {
  return {
    prefix: key.length < 2 ? Prefix.NONE : parseInt(key.slice(0, 2), 16),
    len: key.length / 2,
  }
}

function prefixRepr(prefix: Prefix): string {
  return prefix === Prefix.NONE
    ? 'None'
    : `0x${prefix.toString(16).padStart(2, '0')}`
}

function getValidFormatsTable(type: KeyType) {
  // No need overkill with renderTable method
  const padding = 2
  const colWidth = {
    algorithm: 'ecdsa-secp256k1'.length + padding,
    prefix: '0x00'.length + padding,
  }

  return Object.entries(KEY_TYPES)
    .filter(([key]) => key.startsWith(type))
    .map(([key, algorithm]) => {
      const [, prefix, length] = key.split('_')
      const paddedAlgo = algorithm.padEnd(colWidth.algorithm)
      const paddedPrefix = prefixRepr(Number(prefix)).padEnd(colWidth.prefix)
      return `${paddedAlgo} - Prefix: ${paddedPrefix} Length: ${length} bytes`
    })
    .join('\n')
}

function keyError({
  key,
  type,
  prefix,
  len,
}: {
  key: string
  type: KeyType
  prefix: number
  len: number
}) {
  const validFormats = getValidFormatsTable(type)

  return `invalid_key:

Type: ${type}
Key: ${key}
Prefix: ${prefixRepr(prefix)} 
Length: ${len} bytes

Acceptable ${type} formats are:
${validFormats}
`
}

/**
 * Determines the algorithm associated with a given key (public/private).
 *
 * @param key - hexadecimal string representation of the key.
 * @param type - whether expected key is public or private
 * @returns Algorithm algorithm for signing/verifying
 * @throws Error when key is invalid
 */
export function getAlgorithmFromKey(key: HexString, type: KeyType): Algorithm {
  const { prefix, len } = getKeyInfo(key)
  // Special case back compat support for no prefix
  const usedPrefix = type === 'private' && len === 32 ? Prefix.NONE : prefix
  const algorithm = KEY_TYPES[`${type}_${usedPrefix}_${len}`]

  if (!algorithm) {
    throw new Error(keyError({ key, type, len, prefix: usedPrefix }))
  }
  return algorithm
}

export function getAlgorithmFromPublicKey(key: HexString): Algorithm {
  return getAlgorithmFromKey(key, 'public')
}

export function getAlgorithmFromPrivateKey(key: HexString): Algorithm {
  return getAlgorithmFromKey(key, 'private')
}
