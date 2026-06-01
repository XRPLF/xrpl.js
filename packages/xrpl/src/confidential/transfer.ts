import { type Client } from '../client'
import { XrplError } from '../errors'
import {
  ConfidentialMPTClawback,
  ConfidentialMPTSend,
} from '../models/transactions'

import {
  accountIdHex,
  fetchMPToken,
  fetchMPTokenIssuance,
  resolveSequence,
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
// eslint-disable-next-line max-lines-per-function, max-statements -- one cohesive proof-assembly flow
export async function prepareConfidentialSend(
  client: Client,
  params: ConfidentialSendParams,
): Promise<ConfidentialMPTSend> {
  const [crypto, issuance, senderToken, destToken, sequence] =
    await Promise.all([
      loadMptCrypto(),
      fetchMPTokenIssuance(client, params.mptIssuanceID),
      fetchMPToken(client, params.account, params.mptIssuanceID),
      fetchMPToken(client, params.destination, params.mptIssuanceID),
      resolveSequence(client, params.account, params.sequence),
    ])
  if (issuance.IssuerEncryptionKey == null) {
    throw new XrplError(
      `Issuance ${params.mptIssuanceID} has no registered IssuerEncryptionKey`,
    )
  }
  if (senderToken.ConfidentialBalanceSpending == null) {
    throw new XrplError(
      `Account ${params.account} has no confidential spending balance`,
    )
  }
  if (destToken.HolderEncryptionKey == null) {
    throw new XrplError(
      `Destination ${params.destination} has no registered HolderEncryptionKey`,
    )
  }
  const { amount, sender } = params
  const destKey = destToken.HolderEncryptionKey
  const issuerKey = issuance.IssuerEncryptionKey
  const spending = senderToken.ConfidentialBalanceSpending
  const version = senderToken.ConfidentialBalanceVersion ?? 0

  // `txBlinding` is the shared ElGamal randomness AND the amount-commitment
  // blinding; `rho` blinds the balance commitment. `balance` is the sender's
  // full current balance, the range-proof witness linked to the on-ledger
  // `spending` ciphertext via the sender's private key.
  const [balance, txBlinding, rho, contextHash] = await Promise.all([
    crypto.decryptAmount(spending, sender.privateKey),
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
      crypto.encryptAmount(amount, sender.publicKey, txBlinding),
      crypto.encryptAmount(amount, destKey, txBlinding),
      crypto.encryptAmount(amount, issuerKey, txBlinding),
    ])

  // Proof participants are ordered sender, destination, issuer, [auditor].
  const participants: SendParticipant[] = [
    { publicKey: sender.publicKey, ciphertext: senderCt },
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
      privateKey: sender.privateKey,
      publicKey: sender.publicKey,
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
  const [crypto, holderToken, sequence] = await Promise.all([
    loadMptCrypto(),
    fetchMPToken(client, params.holder, params.mptIssuanceID),
    resolveSequence(client, params.account, params.sequence),
  ])
  if (holderToken.IssuerEncryptedBalance == null) {
    throw new XrplError(
      `Holder ${params.holder} has no issuer-encrypted confidential balance`,
    )
  }
  const { issuer } = params
  const issuerBalance = holderToken.IssuerEncryptedBalance
  const amount =
    params.amount ??
    (await crypto.decryptAmount(issuerBalance, issuer.privateKey))
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
      issuer.privateKey,
      issuer.publicKey,
      contextHash,
      amount,
      issuerBalance,
    ),
  }
}
