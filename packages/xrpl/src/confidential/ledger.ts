import { bytesToHex } from '@xrplf/isomorphic/utils'
import { decodeAccountID } from 'ripple-address-codec'

import { type Client } from '../client'
import { XrplError } from '../errors'
import { MPToken, MPTokenIssuance } from '../models/ledger'
import { MAX_MPT_AMOUNT } from '../models/transactions/common'

import { loadMptCrypto } from './loader'
import type { ConfidentialSpendingState } from './types'

/**
 * Guard a public MPT amount before it reaches the WASM crypto layer. The crypto
 * marshalling only rejects values that would wrap a `uint64` (> 2^64 - 1), but
 * MPT amounts are capped at 2^63 - 1 ({@link MAX_MPT_AMOUNT}); an amount between
 * those bounds would assemble a valid-looking transaction that rippled then
 * rejects with `temBAD_AMOUNT`. Fail fast here instead. Mirrors the model-level
 * `validateConfidentialMPTAmount` for the builders' `bigint` inputs.
 *
 * @param amount - The public MPT amount to validate.
 * @param allowZero - Whether zero is permitted (only ConfidentialMPTConvert and,
 *   like rippled, ConfidentialMPTSend leave the amount unconstrained at zero).
 * @throws {XrplError} If the amount is negative, above the max, or a disallowed zero.
 */
export function assertConfidentialAmount(
  amount: bigint,
  allowZero: boolean,
): void {
  if (
    amount < BigInt(0) ||
    amount > MAX_MPT_AMOUNT ||
    (!allowZero && amount === BigInt(0))
  ) {
    const low = allowZero ? '0' : '1'
    throw new XrplError(
      `Confidential MPT amount out of range [${low}, ${MAX_MPT_AMOUNT.toString()}]: ${amount.toString()}`,
    )
  }
}

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
 * `outstandingDelta` raises the bound by confidential value a caller knows will be
 * added but the ledger does not yet reflect. {@link prepareConfidentialBatch} passes
 * the sum of in-batch Convert amounts, so a Send/ConvertBack/Clawback touching a
 * balance topped up earlier in the same Batch still searches a wide-enough range —
 * the fetched outstanding is pre-batch and would otherwise be too low.
 *
 * @param issuance - The MPTokenIssuance ledger entry.
 * @param outstandingDelta - Extra headroom added to the bound (default 0).
 * @returns The decrypt upper bound.
 */
export function decryptBound(
  issuance: MPTokenIssuance,
  outstandingDelta = BigInt(0),
): bigint {
  return BigInt(issuance.ConfidentialOutstandingAmount ?? 0) + outstandingDelta
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

/**
 * Read the issuer's registered ElGamal encryption key, throwing if the issuance
 * has none (Convert/Send/ConvertBack all encrypt the amount to it).
 *
 * @param issuance - The MPTokenIssuance ledger entry.
 * @param mptIssuanceID - The issuance ID, for the error message.
 * @returns The issuer's 33-byte hex public key.
 * @throws {XrplError} If no issuer encryption key is registered.
 */
export function requireIssuerKey(
  issuance: MPTokenIssuance,
  mptIssuanceID: string,
): string {
  if (issuance.IssuerEncryptionKey == null) {
    throw new XrplError(
      `Issuance ${mptIssuanceID} has no registered IssuerEncryptionKey`,
    )
  }
  return issuance.IssuerEncryptionKey
}

/**
 * Resolve the spending balance + version a Send/ConvertBack proof binds:
 * {@link prepareConfidentialBatch}'s predicted `override` when given, else the
 * account's live on-ledger values. Inside a Batch an earlier same-`(account, token)`
 * inner leaves state the ledger does not yet reflect, so the override wins.
 *
 * @param token - The account's MPToken ledger entry.
 * @param account - The account's classic address, for the error message.
 * @param override - Predicted spending state, or `undefined` for a standalone build.
 * @returns The spending ciphertext and version to prove against.
 * @throws {XrplError} If the account has no confidential spending balance.
 */
export function resolveSpendingState(
  token: MPToken,
  account: string,
  override?: ConfidentialSpendingState,
): { spending: string; version: number } {
  const spending = override?.spending ?? token.ConfidentialBalanceSpending
  if (spending == null) {
    throw new XrplError(
      `Account ${account} has no confidential spending balance`,
    )
  }
  return {
    spending,
    version: override?.version ?? token.ConfidentialBalanceVersion ?? 0,
  }
}
