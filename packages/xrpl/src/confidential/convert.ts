import { type Client } from '../client'
import { XrplError } from '../errors'
import {
  ConfidentialMPTConvert,
  ConfidentialMPTConvertBack,
  ConfidentialMPTMergeInbox,
} from '../models/transactions'

import {
  accountIdHex,
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
 * factor, and a Schnorr proof attests ownership of the holder key.
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
  const [crypto, issuance, sequence] = await Promise.all([
    loadMptCrypto(),
    fetchMPTokenIssuance(client, params.mptIssuanceID),
    resolveSequence(client, params.account, params.sequence),
  ])
  if (issuance.IssuerEncryptionKey == null) {
    throw new XrplError(
      `Issuance ${params.mptIssuanceID} has no registered IssuerEncryptionKey`,
    )
  }
  const { amount, holder } = params

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
      crypto.encryptAmount(amount, holder.publicKey, blindingFactor),
      crypto.encryptAmount(
        amount,
        issuance.IssuerEncryptionKey,
        blindingFactor,
      ),
      crypto.getConvertProof(holder.publicKey, holder.privateKey, contextHash),
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
    ZKProof: zkProof,
  }
  if (issuance.AuditorEncryptionKey != null) {
    tx.AuditorEncryptedAmount = await crypto.encryptAmount(
      amount,
      issuance.AuditorEncryptionKey,
      blindingFactor,
    )
  }
  if (params.registerKey ?? true) {
    tx.HolderEncryptionKey = holder.publicKey
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
  if (mptoken.ConfidentialBalanceSpending == null) {
    throw new XrplError(
      `Account ${params.account} has no confidential spending balance`,
    )
  }
  const { amount, holder } = params
  const spending = mptoken.ConfidentialBalanceSpending
  const version = mptoken.ConfidentialBalanceVersion ?? 0

  // `balance` is the full current balance (the range-proof witness); `rho`
  // blinds the balance commitment, `blindingFactor` the revealed-amount
  // ciphertexts. The proof links the on-ledger `spending` ciphertext via the
  // holder's private key.
  const [balance, blindingFactor, rho, contextHash] = await Promise.all([
    crypto.decryptAmount(spending, holder.privateKey),
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
      crypto.encryptAmount(amount, holder.publicKey, blindingFactor),
      crypto.encryptAmount(
        amount,
        issuance.IssuerEncryptionKey,
        blindingFactor,
      ),
      crypto.getConvertBackProof(
        holder.privateKey,
        holder.publicKey,
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
