import { type Client } from '../client'
import { XrplError } from '../errors'
import {
  ConfidentialMPTClawback,
  ConfidentialMPTSend,
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
import { ConfidentialClawbackParams, ConfidentialSendParams } from './types'

interface SendParticipant {
  publicKey: string
  ciphertext: string
}

/**
 * Build a ConfidentialMPTSend transaction that transfers a confidential amount
 * from the sender's spendable balance to the destination's inbox. The amount is
 * encrypted under the sender, destination, issuer, and (when registered) auditor
 * keys with a shared blinding factor, and a single proof binds the amount
 * commitment, balance commitment, and per-recipient ciphertexts.
 *
 * @param client - A connected Client.
 * @param params - The send inputs.
 * @returns The assembled, unsigned ConfidentialMPTSend transaction.
 * @throws {XrplError} If a required encryption key or the sender balance is missing.
 */
// eslint-disable-next-line max-lines-per-function -- one cohesive proof-assembly flow
export async function prepareConfidentialSend(
  client: Client,
  params: ConfidentialSendParams,
): Promise<ConfidentialMPTSend> {
  // A confidential balance can never exceed MAX_MPT_AMOUNT, so an amount above
  // it (or negative) is unspendable; reject it before the crypto layer, which
  // would otherwise accept anything up to 2^64 - 1.
  assertConfidentialAmount(params.amount, true)
  const [crypto, ledgerIndex] = await Promise.all([
    loadMptCrypto(),
    resolveLedgerIndex(client, params.ledgerIndex),
  ])
  const [issuance, senderToken, destToken, sequence] = await Promise.all([
    fetchMPTokenIssuance(client, params.mptIssuanceID, ledgerIndex),
    fetchMPToken(client, params.account, params.mptIssuanceID, ledgerIndex),
    fetchMPToken(client, params.destination, params.mptIssuanceID, ledgerIndex),
    resolveSequence(client, params.account, params.sequence),
  ])
  const issuerKey = requireIssuerKey(issuance, params.mptIssuanceID)
  const { amount, senderKeypair } = params
  // The destination's ElGamal key: prefer a supplied value —
  // prepareConfidentialBatch passes it when an earlier same-batch Convert
  // registers the destination before it is on-ledger — else the on-ledger MPToken.
  const destKey = params.destinationKey ?? destToken.HolderEncryptionKey
  if (destKey == null) {
    throw new XrplError(
      `Destination ${params.destination} has no registered HolderEncryptionKey`,
    )
  }
  const { spending, version } = resolveSpendingState(
    senderToken,
    params.account,
    params.confidentialState,
  )

  // `txBlinding` is the shared ElGamal randomness AND the amount-commitment
  // blinding; `rho` blinds the balance commitment. `balance` is the sender's
  // full current balance, the range-proof witness linked to the on-ledger
  // `spending` ciphertext via the sender's private key.
  const [balance, txBlinding, rho, contextHash] = await Promise.all([
    crypto.decryptAmount(
      spending,
      senderKeypair.privateKey,
      decryptBound(issuance, params.outstandingDelta),
    ),
    crypto.generateBlindingFactor(),
    crypto.generateBlindingFactor(),
    crypto.getSendContextHash(
      accountIdHex(params.account),
      params.mptIssuanceID,
      sequence,
      accountIdHex(params.destination),
      version,
    ),
  ])
  const [amountCommitment, balanceCommitment, senderCt, destCt, issuerCt] =
    await Promise.all([
      crypto.getPedersenCommitment(amount, txBlinding),
      crypto.getPedersenCommitment(balance, rho),
      crypto.encryptAmount(amount, senderKeypair.publicKey, txBlinding),
      crypto.encryptAmount(amount, destKey, txBlinding),
      crypto.encryptAmount(amount, issuerKey, txBlinding),
    ])

  // Proof participants are ordered sender, destination, issuer, [auditor].
  const participants: SendParticipant[] = [
    { publicKey: senderKeypair.publicKey, ciphertext: senderCt },
    { publicKey: destKey, ciphertext: destCt },
    { publicKey: issuerKey, ciphertext: issuerCt },
  ]
  let auditorCt: string | undefined
  if (issuance.AuditorEncryptionKey != null) {
    auditorCt = await crypto.encryptAmount(
      amount,
      issuance.AuditorEncryptionKey,
      txBlinding,
    )
    participants.push({
      publicKey: issuance.AuditorEncryptionKey,
      ciphertext: auditorCt,
    })
  }

  const tx: ConfidentialMPTSend = {
    TransactionType: 'ConfidentialMPTSend',
    Account: params.account,
    Sequence: sequence,
    MPTokenIssuanceID: params.mptIssuanceID,
    Destination: params.destination,
    SenderEncryptedAmount: senderCt,
    DestinationEncryptedAmount: destCt,
    IssuerEncryptedAmount: issuerCt,
    AmountCommitment: amountCommitment,
    BalanceCommitment: balanceCommitment,
    ZKProof: await crypto.getConfidentialSendProof({
      privateKey: senderKeypair.privateKey,
      publicKey: senderKeypair.publicKey,
      amount,
      participants,
      txBlindingFactor: txBlinding,
      contextHash,
      amountCommitment,
      balanceParams: {
        commitment: balanceCommitment,
        amount: balance,
        ciphertext: spending,
        blindingFactor: rho,
      },
    }),
  }
  if (auditorCt != null) {
    tx.AuditorEncryptedAmount = auditorCt
  }
  if (params.destinationTag != null) {
    tx.DestinationTag = params.destinationTag
  }
  if (params.credentialIDs != null) {
    tx.CredentialIDs = params.credentialIDs
  }
  return tx
}

/**
 * Build a ConfidentialMPTClawback transaction. The issuer recovers the clawed
 * amount by decrypting the holder's issuer-encrypted balance (unless an explicit
 * amount is supplied) and attaches a proof over that ciphertext.
 *
 * @param client - A connected Client.
 * @param params - The clawback inputs.
 * @returns The assembled, unsigned ConfidentialMPTClawback transaction.
 * @throws {XrplError} If the holder has no issuer-encrypted balance.
 */
// eslint-disable-next-line max-lines-per-function -- one cohesive proof-assembly flow
export async function prepareConfidentialClawback(
  client: Client,
  params: ConfidentialClawbackParams,
): Promise<ConfidentialMPTClawback> {
  if (params.amount != null) {
    assertConfidentialAmount(params.amount, false)
  }
  const [crypto, ledgerIndex] = await Promise.all([
    loadMptCrypto(),
    resolveLedgerIndex(client, params.ledgerIndex),
  ])
  const [holderToken, sequence] = await Promise.all([
    fetchMPToken(client, params.holder, params.mptIssuanceID, ledgerIndex),
    resolveSequence(client, params.account, params.sequence),
  ])
  const { issuerKeypair } = params
  // `issuerEncryptedBalanceOverride` lets prepareConfidentialBatch build this proof
  // against the issuer-encrypted balance a prior same-batch inner leaves behind — e.g.
  // a Convert then Clawback in one Batch, where the on-ledger balance is still absent —
  // so resolve it before the null-check; a standalone clawback needs the on-ledger one.
  const issuerBalance =
    params.issuerEncryptedBalanceOverride ?? holderToken.IssuerEncryptedBalance
  if (issuerBalance == null) {
    throw new XrplError(
      `Holder ${params.holder} has no issuer-encrypted confidential balance`,
    )
  }
  const amount =
    params.amount ??
    (await crypto.decryptAmount(
      issuerBalance,
      issuerKeypair.privateKey,
      decryptBound(
        await fetchMPTokenIssuance(client, params.mptIssuanceID, ledgerIndex),
        params.outstandingDelta,
      ),
    ))
  const contextHash = await crypto.getClawbackContextHash(
    accountIdHex(params.account),
    params.mptIssuanceID,
    sequence,
    accountIdHex(params.holder),
  )

  return {
    TransactionType: 'ConfidentialMPTClawback',
    Account: params.account,
    Sequence: sequence,
    MPTokenIssuanceID: params.mptIssuanceID,
    Holder: params.holder,
    MPTAmount: amount.toString(),
    ZKProof: await crypto.getClawbackProof(
      issuerKeypair.privateKey,
      issuerKeypair.publicKey,
      contextHash,
      amount,
      issuerBalance,
    ),
  }
}
