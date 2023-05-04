declare const window: any

type CreateHashFn = (algo: 'sha512') => {
  update(buffer: Uint8Array): void
  digest(): Uint8Array
}

export const createHash: CreateHashFn = (() => {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    const { sha512 } = require('@noble/hashes/sha512');

    return (type) => {
      if (type !== 'sha512') {
        throw new Error('Unsupported hash type');
      }
      return sha512.create();
    };
  } else {
    const crypto = require('crypto');

    return (type) => {
      const hash = crypto.createHash(type);

      return {
        update: (data: Uint8Array) => {
          return hash.update(data)
        },
        digest: () => {
          return hash.digest()
        },
      };
    };
  }
})();
