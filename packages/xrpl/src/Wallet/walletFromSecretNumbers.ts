import { Account } from '@xrplf/secret-numbers'

import ECDSA from '../ECDSA'

import { Wallet } from '.'

/**
 * Derives a wallet from secret numbers.
 * NOTE: This uses a default algorithm of secp256k1 to match the popular wallet
 * [Xumm (aka Xaman)](https://xumm.app/)'s behavior. Other Wallet factories such
 * as `Wallet.fromSeed` infer the algorithm from the seed prefix instead, so the
 * default here intentionally differs from those.
 *
 * @param secretNumbers - A string consisting of 8 times 6 numbers (whitespace delimited) used to derive a wallet.
 * @param opts - (Optional) Options to derive a Wallet.
 * @param opts.masterAddress - Include if a Wallet uses a Regular Key Pair. It must be the master address of the account.
 * @param opts.algorithm - The digital signature algorithm to generate an address for. Defaults to
 *                         `ECDSA.secp256k1` to remain compatible with Xaman-issued secret numbers.
 * @returns A Wallet derived from secret numbers.
 * @throws ValidationError if unable to derive private key from secret number input.
 */
export function walletFromSecretNumbers(
  secretNumbers: string[] | string,
  opts?: { masterAddress?: string; algorithm?: ECDSA },
): Wallet {
  // Use secp256k1 since that's the algorithm used by popular wallets like Xumm when generating secret number accounts
  const algorithm = opts?.algorithm ?? ECDSA.secp256k1
  // Pass the algorithm into Account so the family seed's prefix matches the
  // keypair derivation. Otherwise Account defaults to ed25519 and produces an
  // ed25519-family seed, which cannot restore this wallet via
  // Wallet.fromSeed (the algorithm is inferred from the seed prefix there).
  const secret = new Account(secretNumbers, algorithm).getFamilySeed()
  return Wallet.fromSecret(secret, {
    masterAddress: opts?.masterAddress,
    algorithm,
  })
}
