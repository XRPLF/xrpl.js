declare const window: any

type Sha256Fn = (data: Uint8Array | number[]) => Uint8Array

export const sha256: Sha256Fn = (() => {
  const isBrowser = typeof window !== 'undefined'

  if (isBrowser) {
    const { sha256: nobleSha256 } = require('@noble/hashes/sha256')

    return (data) => {
      return nobleSha256(Array.isArray(data) ? new Uint8Array(data) : data)
    }
  } else {
    const crypto = require('crypto')

    return (data) => {
      const hash = crypto.createHash('sha256')
      hash.update(Buffer.from(data))
      return hash.digest()
    }
  }
})()
