import { deriveAddress, deriveKeypair, generateSeed } from 'ripple-keypairs'

import {
  entropyToSecret,
  parseSecretString,
  randomSecret,
  secretToEntropy,
} from '../utils'

/* Types ==================================================================== */

export interface Keypair {
  publicKey: string
  privateKey: string
}

interface AccountData {
  familySeed: string
  address: string
  keypair: Keypair
}

/* Class ==================================================================== */

export class Account {
  private readonly _secret: string[]
  private readonly _account: AccountData = {
    familySeed: '',
    address: '',
    keypair: {
      publicKey: '',
      privateKey: '',
    },
  }

  constructor(secretNumbers?: string[] | string | Uint8Array) {
    if (typeof secretNumbers === 'string') {
      this._secret = parseSecretString(secretNumbers)
    } else if (Array.isArray(secretNumbers)) {
      this._secret = secretNumbers
    } else if (secretNumbers instanceof Uint8Array) {
      this._secret = entropyToSecret(secretNumbers)
    } else {
      this._secret = randomSecret()
    }

    validateLengths(this._secret)
    this.derive()
  }

  getSecret(): string[] {
    return this._secret
  }

  getSecretString(): string {
    return this._secret.join(' ')
  }

  getAddress(): string {
    return this._account.address
  }

  getFamilySeed(): string {
    return this._account.familySeed
  }

  getKeypair(): Keypair {
    return this._account.keypair
  }

  toString(): string {
    return this.getSecretString()
  }

  private derive(): void {
    try {
      const entropy = secretToEntropy(this._secret)
      this._account.familySeed = generateSeed({ entropy })
      this._account.keypair = deriveKeypair(this._account.familySeed)
      this._account.address = deriveAddress(this._account.keypair.publicKey)
    } catch (error) {
      let message = 'Unknown Error'
      if (error instanceof Error) {
        message = error.message
      }
      // we'll proceed, but let's report it
      throw new Error(message)
    }
  }
}

function validateLengths(secretNumbers: string[]): void {
  if (secretNumbers.length !== 8) {
    throw new Error('Secret must have 8 numbers')
  }
  secretNumbers.forEach((num) => {
    if (num.length !== 6) {
      throw new Error('Each secret number must be 6 digits')
    }
  })
}
