import { type Client } from '../client'
import { XrplError } from '../errors'
import {
  ConfidentialMPTConvert,
  ConfidentialMPTConvertBack,
  ConfidentialMPTMergeInbox,
} from '../models/transactions'

import {
  accountIdHex,
  assertConfidentialAmount,
  decryptBound,
  fetchMPToken,
  fetchMPTokenIssuance,
  resolveSequence,
} from './ledger'
import { loadMptCrypto } from './loader'
import {
  ConfidentialConvertBackParams,
  ConfidentialConvertParams,
  ConfidentialMergeInboxParams,
} from './types'

/**
 * Build a ConfidentialMPTConvert transaction that moves a holder's public MPT
 * balance into their confidential balance. The amount is encrypted under the
 * holder, issuer, and (when registered) auditor keys with a shared blinding
 * factor. On the holder's first Convert the holder key is registered and a
 * Schnorr proof attests ownership of it; this is auto-detected from ledger state
 * (see `registerKey`).
 *
 * @param client - A connected Client.
 * @param params - The conversion inputs.
 * @returns The assembled, unsigned ConfidentialMPTConvert transaction.
 * @throws {XrplError} If the issuer encryption key is not registered.
 */
// eslint-disable-next-line max-lines-per-function -- one cohesive proof-assembly flow
export async function prepareConfidentialConvert(
  client: Client,
  params: ConfidentialConvertParams,
): Promise<ConfidentialMPTConvert> {
  // Convert may register the holder key with a zero amount, so zero is allowed.
  assertConfidentialAmount(params.amount, true)
  const [crypto, issuance, mptoken, sequence] = await Promise.all([
    loadMptCrypto(),
    fetchMPTokenIssuance(client, params.mptIssuanceID),
    fetchMPToken(client, params.account, params.mptIssuanceID),
    resolveSequence(client, params.account, params.sequence),
  ])
  if (issuance.IssuerEncryptionKey == null) {
    throw new XrplError(
      `Issuance ${params.mptIssuanceID} has no registered IssuerEncryptionKey`,
    )
  }
  const { amount, holderKeypair } = params

  const [blindingFactor, contextHash] = await Promise.all([
    crypto.generateBlindingFactor(),
    crypto.getConvertContextHash(
      accountIdHex(params.account),
      params.mptIssuanceID,
      sequence,
    ),
  ])
  const [holderEncryptedAmount, issuerEncryptedAmount, zkProof] =
    await Promise.all([
      crypto.encryptAmount(amount, holderKeypair.publicKey, blindingFactor),
      crypto.encryptAmount(
        amount,
        issuance.IssuerEncryptionKey,
        blindingFactor,
      ),
      crypto.getConvertProof(
        holderKeypair.publicKey,
        holderKeypair.privateKey,
        contextHash,
      ),
    ])

  const tx: ConfidentialMPTConvert = {
    TransactionType: 'ConfidentialMPTConvert',
    Account: params.account,
    Sequence: sequence,
    MPTokenIssuanceID: params.mptIssuanceID,
    MPTAmount: amount.toString(),
    HolderEncryptedAmount: holderEncryptedAmount,
    IssuerEncryptedAmount: issuerEncryptedAmount,
    BlindingFactor: blindingFactor,
  }
  if (issuance.AuditorEncryptionKey != null) {
    tx.AuditorEncryptedAmount = await crypto.encryptAmount(
      amount,
      issuance.AuditorEncryptionKey,
      blindingFactor,
    )
  }
  // Register the holder key (with its Schnorr ownership proof) exactly when the
  // ledger doesn't already carry one: rippled requires `HolderEncryptionKey` on
  // the holder's first Convert (else `tecNO_PERMISSION`) and rejects it as
  // `tecDUPLICATE` on every later one. That makes the correct value a function of
  // ledger state, not caller intent, so it is derived here by default; an explicit
  // `registerKey` still overrides. `HolderEncryptionKey` and `ZKProof` are always
  // set or omitted together (rippled rejects one without the other, temMALFORMED).
  const alreadyRegistered = mptoken.HolderEncryptionKey != null
  if (params.registerKey ?? !alreadyRegistered) {
    tx.HolderEncryptionKey = holderKeypair.publicKey
    tx.ZKProof = zkProof
  }
  return tx
}

/**
 * Build a ConfidentialMPTConvertBack transaction that reveals a public MPT
 * amount from a holder's confidential balance. The holder's spendable balance is
 * decrypted to form the Pedersen balance witness bound by the range proof.
 *
 * @param client - A connected Client.
 * @param params - The convert-back inputs.
 * @returns The assembled, unsigned ConfidentialMPTConvertBack transaction.
 * @throws {XrplError} If the issuer key or the holder's spendable balance is missing.
 */
// eslint-disable-next-line max-lines-per-function -- one cohesive proof-assembly flow
export async function prepareConfidentialConvertBack(
  client: Client,
  params: ConfidentialConvertBackParams,
): Promise<ConfidentialMPTConvertBack> {
  // rippled rejects a zero-amount ConvertBack with temBAD_AMOUNT.
  assertConfidentialAmount(params.amount, false)
  const [crypto, issuance, mptoken, sequence] = await Promise.all([
    loadMptCrypto(),
    fetchMPTokenIssuance(client, params.mptIssuanceID),
    fetchMPToken(client, params.account, params.mptIssuanceID),
    resolveSequence(client, params.account, params.sequence),
  ])
  if (issuance.IssuerEncryptionKey == null) {
    throw new XrplError(
      `Issuance ${params.mptIssuanceID} has no registered IssuerEncryptionKey`,
    )
  }
  const { amount, holderKeypair } = params
  // `confidentialState` lets prepareConfidentialBatch build this proof against the
  // balance/version a prior same-(account, token) inner leaves behind, rather than
  // the stale on-ledger value; unset for a standalone convert-back.
  const spending =
    params.confidentialState?.spending ?? mptoken.ConfidentialBalanceSpending
  if (spending == null) {
    throw new XrplError(
      `Account ${params.account} has no confidential spending balance`,
    )
  }
  const version =
    params.confidentialState?.version ?? mptoken.ConfidentialBalanceVersion ?? 0

  // `balance` is the full current balance (the range-proof witness); `rho`
  // blinds the balance commitment, `blindingFactor` the revealed-amount
  // ciphertexts. The proof links the on-ledger `spending` ciphertext via the
  // holder's private key.
  const [balance, blindingFactor, rho, contextHash] = await Promise.all([
    crypto.decryptAmount(
      spending,
      holderKeypair.privateKey,
      decryptBound(issuance, params.outstandingDelta),
    ),
    crypto.generateBlindingFactor(),
    crypto.generateBlindingFactor(),
    crypto.getConvertBackContextHash(
      accountIdHex(params.account),
      params.mptIssuanceID,
      sequence,
      version,
    ),
  ])
  const balanceCommitment = await crypto.getPedersenCommitment(balance, rho)
  const [holderEncryptedAmount, issuerEncryptedAmount, zkProof] =
    await Promise.all([
      crypto.encryptAmount(amount, holderKeypair.publicKey, blindingFactor),
      crypto.encryptAmount(
        amount,
        issuance.IssuerEncryptionKey,
        blindingFactor,
      ),
      crypto.getConvertBackProof(
        holderKeypair.privateKey,
        holderKeypair.publicKey,
        contextHash,
        amount,
        {
          commitment: balanceCommitment,
          amount: balance,
          ciphertext: spending,
          blindingFactor: rho,
        },
      ),
    ])

  const tx: ConfidentialMPTConvertBack = {
    TransactionType: 'ConfidentialMPTConvertBack',
    Account: params.account,
    Sequence: sequence,
    MPTokenIssuanceID: params.mptIssuanceID,
    MPTAmount: amount.toString(),
    HolderEncryptedAmount: holderEncryptedAmount,
    IssuerEncryptedAmount: issuerEncryptedAmount,
    BlindingFactor: blindingFactor,
    BalanceCommitment: balanceCommitment,
    ZKProof: zkProof,
  }
  if (issuance.AuditorEncryptionKey != null) {
    tx.AuditorEncryptedAmount = await crypto.encryptAmount(
      amount,
      issuance.AuditorEncryptionKey,
      blindingFactor,
    )
  }
  return tx
}

/**
 * Build a ConfidentialMPTMergeInbox transaction that folds a holder's pending
 * confidential inbox balance into their spendable balance. No crypto material is
 * required; the builder only resolves the account sequence.
 *
 * @param client - A connected Client.
 * @param params - The merge-inbox inputs.
 * @returns The assembled, unsigned ConfidentialMPTMergeInbox transaction.
 */
export async function prepareConfidentialMergeInbox(
  client: Client,
  params: ConfidentialMergeInboxParams,
): Promise<ConfidentialMPTMergeInbox> {
  return {
    TransactionType: 'ConfidentialMPTMergeInbox',
    Account: params.account,
    Sequence: await resolveSequence(client, params.account, params.sequence),
    MPTokenIssuanceID: params.mptIssuanceID,
  }
}
