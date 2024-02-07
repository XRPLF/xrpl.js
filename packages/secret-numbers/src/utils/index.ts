import {
  bytesToHex,
  concat,
  hexToBytes,
  randomBytes,
} from '@xrplf/isomorphic/utils'

function randomEntropy(): Uint8Array {
  return randomBytes(16)
}

function calculateChecksum(position: number, value: number): number {
  return (value * (position * 2 + 1)) % 9
}

function checkChecksum(
  position: number,
  value: number | string,
  checksum?: number,
): boolean {
  let normalizedChecksum: number
  let normalizedValue: number

  if (typeof value === 'string') {
    if (value.length !== 6) {
      throw new Error('value must have a length of 6')
    }
    normalizedChecksum = parseInt(value.slice(5), 10)
    normalizedValue = parseInt(value.slice(0, 5), 10)
  } else {
    if (typeof checksum !== 'number') {
      throw new Error('checksum must be a number when value is a number')
    }
    normalizedChecksum = checksum
    normalizedValue = value
  }
  return (normalizedValue * (position * 2 + 1)) % 9 === normalizedChecksum
}

function entropyToSecret(entropy: Uint8Array): string[] {
  const len = new Array(Math.ceil(entropy.length / 2))
  const chunks = Array.from(len, (_a, chunk) => {
    const buffChunk = entropy.slice(chunk * 2, (chunk + 1) * 2)
    const no = parseInt(bytesToHex(buffChunk), 16)
    const fill = '0'.repeat(5 - String(no).length)
    return fill + String(no) + String(calculateChecksum(chunk, no))
  })
  if (chunks.length !== 8) {
    throw new Error('Chucks must have 8 digits')
  }
  return chunks
}

function randomSecret(): string[] {
  return entropyToSecret(randomEntropy())
}

function secretToEntropy(secret: string[]): Uint8Array {
  return concat(
    secret.map((chunk, i) => {
      const no = Number(chunk.slice(0, 5))
      const checksum = Number(chunk.slice(5))
      if (chunk.length !== 6) {
        throw new Error('Invalid secret: number invalid')
      }
      if (!checkChecksum(i, no, checksum)) {
        throw new Error('Invalid secret part: checksum invalid')
      }
      const hex = `0000${no.toString(16)}`.slice(-4)
      return hexToBytes(hex)
    }),
  )
}

function parseSecretString(secret: string): string[] {
  const normalizedSecret = secret.replace(/[^0-9]/gu, '')
  if (normalizedSecret.length !== 48) {
    throw new Error(
      'Invalid secret string (should contain 8 blocks of 6 digits',
    )
  }
  return Array.from(new Array(8), (_a, index) => {
    return normalizedSecret.slice(index * 6, (index + 1) * 6)
  })
}

export {
  randomEntropy,
  randomSecret,
  entropyToSecret,
  secretToEntropy,
  calculateChecksum,
  checkChecksum,
  parseSecretString,
}
