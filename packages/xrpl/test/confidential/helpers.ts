import { assert } from 'chai'

import { type Client } from '../../src'
import { XrplError } from '../../src/errors'

// Two distinct secp256k1 keypairs (bare 32-byte private scalars). Used as the
// holder/sender/issuer key (A) and a separate destination key (B) so ciphertexts
// encrypted to one only decrypt with the matching private key.
export const KEY_A = {
  publicKey:
    '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020',
  privateKey:
    '1ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7',
}
export const KEY_B = {
  publicKey:
    '038AFFACA9B0DD89ABC97E519F187AEA000054F4BDDA96B83E59B8EBAD5A8E72FD',
  privateKey:
    'E1C00F71BD7C62A38743D5E42176713ABF061AFEC57FAC57665FF8070475FD3F',
}

// Classic addresses for the two parties (independent of the ElGamal keypairs).
export const ADDR_A = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
export const ADDR_B = 'rLpgximdBvEHy8TxUwyj6mjCRNcJju5qGG'

export const ISSUANCE_ID = 'AB'.repeat(24)

interface LedgerFixtures {
  issuance?: Record<string, unknown>
  mptoken?: Record<string, Record<string, unknown>>
  sequence?: number
  ledgerIndex?: number
}

interface StubRequest {
  command: string
  mpt_issuance?: string
  mptoken?: { account: string }
}

/**
 * A Client stub that dispatches `request` to canned ledger fixtures:
 * `account_info` → `sequence`; `ledger_entry {mpt_issuance}` → the issuance
 * node; `ledger_entry {mptoken}` → the per-account MPToken node. `getLedgerIndex`
 * returns `ledgerIndex` (the builders resolve one to pin their state reads).
 *
 * @param fixtures - Issuance/MPToken nodes, the account sequence, and the ledger
 *   index to serve.
 * @returns A Client whose `request`/`getLedgerIndex` return the fixtures.
 */
export function mockClient(fixtures: LedgerFixtures): Client {
  const request = async (req: StubRequest): Promise<unknown> => {
    if (req.command === 'account_info') {
      return { result: { account_data: { Sequence: fixtures.sequence ?? 1 } } }
    }
    if (req.mpt_issuance != null) {
      return {
        result: {
          // Default a confidential outstanding amount so the builders can derive
          // a decrypt bound; callers may override it via `fixtures.issuance`.
          node: {
            ConfidentialOutstandingAmount: '1000000',
            ...fixtures.issuance,
          },
        },
      }
    }
    if (req.mptoken != null) {
      return { result: { node: fixtures.mptoken?.[req.mptoken.account] ?? {} } }
    }
    throw new Error(`unexpected request: ${JSON.stringify(req)}`)
  }
  const getLedgerIndex = async (): Promise<number> =>
    fixtures.ledgerIndex ?? 100
  return { request, getLedgerIndex } as unknown as Client
}

/**
 * Assert that an async builder call rejects with an {@link XrplError}.
 *
 * @param fn - A thunk that invokes the builder and should reject.
 */
export async function assertRejectsXrplError(
  fn: () => Promise<unknown>,
): Promise<void> {
  let error: unknown
  try {
    await fn()
  } catch (err) {
    error = err
  }
  assert.instanceOf(error, XrplError)
}

/**
 * Assert that an async call rejects (throws any error) — e.g. the WASM refusing
 * to build a proof for an invalid spend.
 *
 * @param fn - A thunk that should reject.
 */
export async function assertRejects(fn: () => Promise<unknown>): Promise<void> {
  let threw = false
  try {
    await fn()
  } catch {
    threw = true
  }
  assert.isTrue(threw, 'expected the call to reject')
}
