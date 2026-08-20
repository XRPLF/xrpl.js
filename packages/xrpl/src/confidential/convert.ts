import { type Client } from '../client'
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
  requireIssuerKey,
  resolveLedgerIndex,
  resolveSequence,
  resolveSpendingState,
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
  const [crypto, ledgerIndex] = await Promise.all([
    loadMptCrypto(),
    resolveLedgerIndex(client, params.ledgerIndex),
  ])
  const [issuance, mptoken, sequence] = await Promise.all([
    fetchMPTokenIssuance(client, params.mptIssuanceID, ledgerIndex),
    fetchMPToken(client, params.account, params.mptIssuanceID, ledgerIndex),
    resolveSequence(client, params.account, params.sequence),
  ])
  const issuerKey = requireIssuerKey(issuance, params.mptIssuanceID)
  const { amount, holderKeypair } = params

  // Register the holder key exactly when the ledger doesn't already carry one:
  // rippled requires `HolderEncryptionKey` on the holder's first Convert (else
  // `tecNO_PERMISSION`) and rejects it as `tecDUPLICATE` on every later one, so the
  // correct value is a function of ledger state, not caller intent; derive it by
  // default and let an explicit `registerKey` override.
  const shouldRegister =
    params.registerKey ?? mptoken.HolderEncryptionKey == null

  const blindingFactor = await crypto.generateBlindingFactor()
  const [holderEncryptedAmount, issuerEncryptedAmount] = await Promise.all([
    crypto.encryptAmount(amount, holderKeypair.publicKey, blindingFactor),
    crypto.encryptAmount(amount, issuerKey, blindingFactor),
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
  // The Schnorr key-ownership proof is only meaningful when registering, and it is a
  // WASM call — so compute it (and its context hash) solely on that path, not on the
  // common top-up Convert. `HolderEncryptionKey` and `ZKProof` are always set or
  // omitted together (rippled rejects one without the other, temMALFORMED).
  if (shouldRegister) {
    const contextHash = await crypto.getConvertContextHash(
      accountIdHex(params.account),
      params.mptIssuanceID,
      sequence,
    )
    tx.HolderEncryptionKey = holderKeypair.publicKey
    tx.ZKProof = await crypto.getConvertProof(
      holderKeypair.publicKey,
      holderKeypair.privateKey,
      contextHash,
    )
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
  const [crypto, ledgerIndex] = await Promise.all([
    loadMptCrypto(),
    resolveLedgerIndex(client, params.ledgerIndex),
  ])
  const [issuance, mptoken, sequence] = await Promise.all([
    fetchMPTokenIssuance(client, params.mptIssuanceID, ledgerIndex),
    fetchMPToken(client, params.account, params.mptIssuanceID, ledgerIndex),
    resolveSequence(client, params.account, params.sequence),
  ])
  const issuerKey = requireIssuerKey(issuance, params.mptIssuanceID)
  const { amount, holderKeypair } = params
  const { spending, version } = resolveSpendingState(
    mptoken,
    params.account,
    params.confidentialState,
  )

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
      crypto.encryptAmount(amount, issuerKey, blindingFactor),
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
