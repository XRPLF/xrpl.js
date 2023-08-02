import { Account } from 'xrpl-secret-numbers'

import ECDSA from '../ECDSA'

import { Wallet } from '.'

/**
 * Derives a wallet from secret numbers.
 * NOTE: This uses a default encoding algorithm of secp256k1 to match the popular wallet
 * [Xumm (aka Xaman)](https://xumm.app/)'s behavior.
 * This may be different from the DEFAULT_ALGORITHM for other ways to generate a Wallet.
 *
 * @param secretNumbers - A string consisting of 8 times 6 numbers (whitespace delimited) used to derive a wallet.
 * @param opts - (Optional) Options to derive a Wallet.
 * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
 * @param opts.algorithm - The digital signature algorithm to generate an address for.
 * @returns A Wallet derived from secret numbers.
 * @throws ValidationError if unable to derive private key from secret number input.
 */
export function walletFromSecretNumbers(
  secretNumbers: string[] | string,
  opts?: { masterAddress?: string; algorithm?: ECDSA },
): Wallet {
  const secret = new Account(secretNumbers).getFamilySeed()
  const updatedOpts: { masterAddress?: string; algorithm?: ECDSA } = {
    masterAddress: undefined,
    algorithm: undefined,
  }
  // Use secp256k1 since that's the algorithm used by popular wallets like Xumm when generating secret number accounts
  if (opts === undefined) {
    updatedOpts.algorithm = ECDSA.secp256k1
  } else {
    updatedOpts.masterAddress = opts.masterAddress
    updatedOpts.algorithm = opts.algorithm ?? ECDSA.secp256k1
  }
  return Wallet.fromSecret(secret, updatedOpts)
}
