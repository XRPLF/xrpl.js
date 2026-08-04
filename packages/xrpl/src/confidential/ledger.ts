import { bytesToHex } from '@xrplf/isomorphic/utils'
import { decodeAccountID } from 'ripple-address-codec'

import { type Client } from '../client'
import { MPToken, MPTokenIssuance } from '../models/ledger'

import { loadMptCrypto } from './loader'

/**
 * Convert a classic XRPL address to its 20-byte AccountID as uppercase hex,
 * the form the `@xrplf/mpt-crypto` context-hash functions expect.
 *
 * @param account - The classic XRPL address (`r...`).
 * @returns The 20-byte AccountID encoded as uppercase hex.
 */
export function accountIdHex(account: string): string {
  return bytesToHex(decodeAccountID(account))
}

/**
 * Fetch the next sequence number for an account from the current ledger.
 *
 * @param client - A connected Client.
 * @param account - The classic XRPL address whose sequence is requested.
 * @returns The account's current `Sequence`.
 */
export async function getAccountSequence(
  client: Client,
  account: string,
): Promise<number> {
  const response = await client.request({
    command: 'account_info',
    account,
  })
  return response.result.account_data.Sequence
}

/**
 * Resolve the sequence to bind a confidential transaction to: the caller's
 * explicit value when given, otherwise the account's current sequence. The
 * builders pin this so the proof's context hash matches the submitted tx.
 *
 * @param client - A connected Client.
 * @param account - The classic XRPL address whose sequence is used as fallback.
 * @param sequence - An explicit sequence, or `undefined` to query the ledger.
 * @returns The resolved sequence number.
 */
export async function resolveSequence(
  client: Client,
  account: string,
  sequence?: number,
): Promise<number> {
  return sequence ?? (await getAccountSequence(client, account))
}

/**
 * Fetch a single MPToken ledger object for a (holder, issuance) pair.
 *
 * @param client - A connected Client.
 * @param account - The classic XRPL address of the token holder.
 * @param mptIssuanceID - The 24-byte hex MPTokenIssuanceID.
 * @returns The holder's MPToken ledger entry.
 * @throws {RippledError} If the MPToken does not exist.
 */
export async function fetchMPToken(
  client: Client,
  account: string,
  mptIssuanceID: string,
): Promise<MPToken> {
  const response = await client.request({
    command: 'ledger_entry',
    mptoken: { mpt_issuance_id: mptIssuanceID, account },
  })
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- ledger_entry returns the requested entry type
  return response.result.node as unknown as MPToken
}

/**
 * Fetch the MPTokenIssuance ledger object, which carries the registered issuer
 * and (optional) auditor encryption keys.
 *
 * @param client - A connected Client.
 * @param mptIssuanceID - The 24-byte hex MPTokenIssuanceID.
 * @returns The MPTokenIssuance ledger entry.
 * @throws {RippledError} If the MPTokenIssuance does not exist.
 */
export async function fetchMPTokenIssuance(
  client: Client,
  mptIssuanceID: string,
): Promise<MPTokenIssuance> {
  const response = await client.request({
    command: 'ledger_entry',
    mpt_issuance: mptIssuanceID,
  })
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- ledger_entry returns the requested entry type
  return response.result.node as unknown as MPTokenIssuance
}

/**
 * The tightest correct upper bound for brute-force decrypting a confidential
 * balance: no holder can hold more than the issuance's confidential outstanding
 * amount (the sum of every confidential balance). Decryption cost is O(bound),
 * so this keeps the search as small as correctness allows — never a fixed cap.
 *
 * `ConfidentialOutstandingAmount` is a default-valued field: rippled omits it
 * once it reaches 0 (e.g. after the last balance is converted back or clawed
 * back). An absent value therefore means the total is 0, so every balance is 0
 * and a bound of `0n` is exactly right — the zero ciphertext still decrypts.
 *
 * @param issuance - The MPTokenIssuance ledger entry.
 * @returns The decrypt upper bound.
 */
export function decryptBound(issuance: MPTokenIssuance): bigint {
  return BigInt(issuance.ConfidentialOutstandingAmount ?? 0)
}

/**
 * Decrypt a holder's spendable confidential balance from the ledger.
 *
 * @param client - A connected Client.
 * @param account - The classic XRPL address of the token holder.
 * @param mptIssuanceID - The 24-byte hex MPTokenIssuanceID.
 * @param privateKey - The holder's 32-byte hex ElGamal private key.
 * @returns The decrypted spendable balance, or `0n` if none is set.
 */
// eslint-disable-next-line max-params -- a connected client plus the (account, issuance, key) lookup tuple
export async function getConfidentialBalance(
  client: Client,
  account: string,
  mptIssuanceID: string,
  privateKey: string,
): Promise<bigint> {
  const mptoken = await fetchMPToken(client, account, mptIssuanceID)
  if (mptoken.ConfidentialBalanceSpending == null) {
    return BigInt(0)
  }
  const [issuance, crypto] = await Promise.all([
    fetchMPTokenIssuance(client, mptIssuanceID),
    loadMptCrypto(),
  ])
  return crypto.decryptAmount(
    mptoken.ConfidentialBalanceSpending,
    privateKey,
    decryptBound(issuance),
  )
}
