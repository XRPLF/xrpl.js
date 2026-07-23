import { hexToBytes } from '@xrplf/isomorphic/utils'
import { encryptAmount, generateBlindingFactor } from '@xrplf/mpt-crypto'
import { assert } from 'chai'
import { encodeAccountID } from 'ripple-address-codec'

import { type Client } from '../../src'
import {
  accountIdHex,
  fetchMPToken,
  fetchMPTokenIssuance,
  getAccountSequence,
  getConfidentialBalance,
  resolveSequence,
} from '../../src/confidential/ledger'

const ADDRESS = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const ISSUANCE_ID = 'AB'.repeat(24)
const PUBLIC_KEY =
  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
const PRIVATE_KEY =
  '1ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7'

/**
 * A minimal Client stub that answers `request` with a canned response.
 *
 * @param respond - Produces the response object for a given request.
 * @returns A Client whose `request` delegates to `respond`.
 */
function fakeClient(
  respond: (request: { command: string } & Record<string, unknown>) => unknown,
): Client {
  return {
    request: async (request: { command: string } & Record<string, unknown>) =>
      respond(request),
  } as unknown as Client
}

describe('confidential/ledger', function () {
  describe('accountIdHex', function () {
    it('encodes a classic address to its 20-byte AccountID hex', function () {
      const hex = accountIdHex(ADDRESS)
      assert.match(hex, /^[0-9A-F]{40}$/u)
      // round-trips back to the original address
      assert.strictEqual(encodeAccountID(hexToBytes(hex)), ADDRESS)
    })
  })

  describe('getAccountSequence / resolveSequence', function () {
    it('reads Sequence from account_info', async function () {
      const client = fakeClient((request) => {
        assert.strictEqual(request.command, 'account_info')
        return { result: { account_data: { Sequence: 42 } } }
      })
      assert.strictEqual(await getAccountSequence(client, ADDRESS), 42)
    })

    it('resolveSequence prefers an explicit value without querying', async function () {
      const client = fakeClient(() => {
        throw new Error('resolveSequence must not query when given a sequence')
      })
      assert.strictEqual(await resolveSequence(client, ADDRESS, 7), 7)
    })

    it('resolveSequence falls back to the ledger sequence', async function () {
      const client = fakeClient(() => ({
        result: { account_data: { Sequence: 9 } },
      }))
      assert.strictEqual(await resolveSequence(client, ADDRESS), 9)
    })
  })

  describe('fetchMPToken / fetchMPTokenIssuance', function () {
    it('returns the MPToken node for a (holder, issuance) pair', async function () {
      const client = fakeClient((request) => {
        assert.strictEqual(request.command, 'ledger_entry')
        return {
          result: { node: { LedgerEntryType: 'MPToken', MPTAmount: '5' } },
        }
      })
      const token = await fetchMPToken(client, ADDRESS, ISSUANCE_ID)
      assert.strictEqual(token.MPTAmount, '5')
    })

    it('returns the MPTokenIssuance node', async function () {
      const client = fakeClient((request) => {
        assert.strictEqual(request.mpt_issuance, ISSUANCE_ID)
        return {
          result: {
            node: {
              LedgerEntryType: 'MPTokenIssuance',
              IssuerEncryptionKey: PUBLIC_KEY,
            },
          },
        }
      })
      const issuance = await fetchMPTokenIssuance(client, ISSUANCE_ID)
      assert.strictEqual(issuance.IssuerEncryptionKey, PUBLIC_KEY)
    })
  })

  describe('getConfidentialBalance', function () {
    it('returns 0n when no spending balance is set', async function () {
      const client = fakeClient(() => ({ result: { node: {} } }))
      const balance = await getConfidentialBalance(
        client,
        ADDRESS,
        ISSUANCE_ID,
        PRIVATE_KEY,
      )
      assert.strictEqual(balance, BigInt(0))
    })

    it('decrypts ConfidentialBalanceSpending with the holder key', async function () {
      const blinding = await generateBlindingFactor()
      const ciphertext = await encryptAmount(250n, PUBLIC_KEY, blinding)
      const client = fakeClient(() => ({
        result: { node: { ConfidentialBalanceSpending: ciphertext } },
      }))
      const balance = await getConfidentialBalance(
        client,
        ADDRESS,
        ISSUANCE_ID,
        PRIVATE_KEY,
      )
      assert.strictEqual(balance, 250n)
    })
  })
})
