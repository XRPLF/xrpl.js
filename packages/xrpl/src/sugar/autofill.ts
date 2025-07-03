/* eslint-disable max-lines -- lots of helper functions needed for autofill */
import BigNumber from 'bignumber.js'
import { xAddressToClassicAddress, isValidXAddress } from 'ripple-address-codec'

import { type Client } from '..'
import { ValidationError, XrplError } from '../errors'
import { AccountInfoRequest, AccountObjectsRequest } from '../models/methods'
import { Batch, Payment, Transaction } from '../models/transactions'
import { xrpToDrops } from '../utils'

import getFeeXrp from './getFeeXrp'

// Expire unconfirmed transactions after 20 ledger versions, approximately 1 minute, by default
const LEDGER_OFFSET = 20
// Sidechains are expected to have network IDs above this.
// Networks with ID above this restricted number are expected specify an accurate NetworkID field
// in every transaction to that chain to prevent replay attacks.
// Mainnet and testnet are exceptions. More context: https://github.com/XRPLF/rippled/pull/4370
const RESTRICTED_NETWORKS = 1024
const REQUIRED_NETWORKID_VERSION = '1.11.0'

/**
 * Determines whether the source rippled version is not later than the target rippled version.
 * Example usage: isNotLaterRippledVersion('1.10.0', '1.11.0') returns true.
 *                isNotLaterRippledVersion('1.10.0', '1.10.0-b1') returns false.
 *
 * @param source -- The source rippled version.
 * @param target -- The target rippled version.
 * @returns True if source is earlier than target, false otherwise.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- Disable for this helper functions.
function isNotLaterRippledVersion(source: string, target: string): boolean {
  if (source === target) {
    return true
  }
  const sourceDecomp = source.split('.')
  const targetDecomp = target.split('.')
  const sourceMajor = parseInt(sourceDecomp[0], 10)
  const sourceMinor = parseInt(sourceDecomp[1], 10)
  const targetMajor = parseInt(targetDecomp[0], 10)
  const targetMinor = parseInt(targetDecomp[1], 10)
  // Compare major version
  if (sourceMajor !== targetMajor) {
    return sourceMajor < targetMajor
  }
  // Compare minor version
  if (sourceMinor !== targetMinor) {
    return sourceMinor < targetMinor
  }
  const sourcePatch = sourceDecomp[2].split('-')
  const targetPatch = targetDecomp[2].split('-')

  const sourcePatchVersion = parseInt(sourcePatch[0], 10)
  const targetPatchVersion = parseInt(targetPatch[0], 10)

  // Compare patch version
  if (sourcePatchVersion !== targetPatchVersion) {
    return sourcePatchVersion < targetPatchVersion
  }

  // Compare release version
  if (sourcePatch.length !== targetPatch.length) {
    return sourcePatch.length > targetPatch.length
  }

  if (sourcePatch.length === 2) {
    // Compare different release types
    if (!sourcePatch[1][0].startsWith(targetPatch[1][0])) {
      return sourcePatch[1] < targetPatch[1]
    }
    // Compare beta version
    if (sourcePatch[1].startsWith('b')) {
      return (
        parseInt(sourcePatch[1].slice(1), 10) <
        parseInt(targetPatch[1].slice(1), 10)
      )
    }
    // Compare rc version
    return (
      parseInt(sourcePatch[1].slice(2), 10) <
      parseInt(targetPatch[1].slice(2), 10)
    )
  }

  return false
}

/**
 * Determine if the transaction required a networkID to be valid.
 * Transaction needs networkID if later than restricted ID and build version is >= 1.11.0
 *
 * @param client -- The connected client.
 * @returns True if required networkID, false otherwise.
 */
export function txNeedsNetworkID(client: Client): boolean {
  if (
    client.networkID !== undefined &&
    client.networkID > RESTRICTED_NETWORKS
  ) {
    if (
      client.buildVersion &&
      isNotLaterRippledVersion(REQUIRED_NETWORKID_VERSION, client.buildVersion)
    ) {
      return true
    }
  }
  return false
}

interface ClassicAccountAndTag {
  classicAccount: string
  tag: number | false | undefined
}

/**
 * Sets valid addresses for the transaction.
 *
 * @param tx - The transaction object.
 */
export function setValidAddresses(tx: Transaction): void {
  validateAccountAddress(tx, 'Account', 'SourceTag')
  // eslint-disable-next-line @typescript-eslint/dot-notation -- Destination can exist on Transaction
  if (tx['Destination'] != null) {
    validateAccountAddress(tx, 'Destination', 'DestinationTag')
  }

  // DepositPreauth:
  convertToClassicAddress(tx, 'Authorize')
  convertToClassicAddress(tx, 'Unauthorize')
  // EscrowCancel, EscrowFinish:
  convertToClassicAddress(tx, 'Owner')
  // SetRegularKey:
  convertToClassicAddress(tx, 'RegularKey')
}

/**
 * Validates the account address in a transaction object.
 *
 * @param tx - The transaction object.
 * @param accountField - The field name for the account address in the transaction object.
 * @param tagField - The field name for the tag in the transaction object.
 * @throws {ValidationError} If the tag field does not match the tag of the account address.
 */
function validateAccountAddress(
  tx: Transaction,
  accountField: string,
  tagField: string,
): void {
  // if X-address is given, convert it to classic address
  const { classicAccount, tag } = getClassicAccountAndTag(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- okay here
    tx[accountField] as string,
  )
  // eslint-disable-next-line no-param-reassign -- param reassign is safe
  tx[accountField] = classicAccount

  if (tag != null && tag !== false) {
    if (tx[tagField] && tx[tagField] !== tag) {
      throw new ValidationError(
        `The ${tagField}, if present, must match the tag of the ${accountField} X-address`,
      )
    }
    // eslint-disable-next-line no-param-reassign -- param reassign is safe
    tx[tagField] = tag
  }
}

/**
 * Retrieves the classic account and tag from an account address.
 *
 * @param account - The account address.
 * @param [expectedTag] - The expected tag for the account address.
 * @returns The classic account and tag.
 * @throws {ValidationError} If the address includes a tag that does not match the tag specified in the transaction.
 */
function getClassicAccountAndTag(
  account: string,
  expectedTag?: number,
): ClassicAccountAndTag {
  if (isValidXAddress(account)) {
    const classic = xAddressToClassicAddress(account)
    if (expectedTag != null && classic.tag !== expectedTag) {
      throw new ValidationError(
        'address includes a tag that does not match the tag specified in the transaction',
      )
    }
    return {
      classicAccount: classic.classicAddress,
      tag: classic.tag,
    }
  }
  return {
    classicAccount: account,
    tag: expectedTag,
  }
}

/**
 * Converts the specified field of a transaction object to a classic address format.
 *
 * @param tx - The transaction object.
 * @param fieldName - The name of the field to convert.export
 */
function convertToClassicAddress(tx: Transaction, fieldName: string): void {
  const account = tx[fieldName]
  if (typeof account === 'string') {
    const { classicAccount } = getClassicAccountAndTag(account)
    // eslint-disable-next-line no-param-reassign -- param reassign is safe
    tx[fieldName] = classicAccount
  }
}

// Helper function to get the next valid sequence number for an account.
async function getNextValidSequenceNumber(
  client: Client,
  account: string,
): Promise<number> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account,
    ledger_index: 'current',
  }
  const data = await client.request(request)
  return data.result.account_data.Sequence
}

/**
 * Sets the next valid sequence number for a transaction.
 *
 * @param client - The client object used for making requests.
 * @param tx - The transaction object for which the sequence number needs to be set.
 * @returns A Promise that resolves when the sequence number is set.
 * @throws {Error} If there is an error retrieving the account information.
 */
export async function setNextValidSequenceNumber(
  client: Client,
  tx: Transaction,
): Promise<void> {
  // eslint-disable-next-line no-param-reassign, require-atomic-updates -- param reassign is safe with no race condition
  tx.Sequence = await getNextValidSequenceNumber(client, tx.Account)
}

/**
 * Fetches the owner reserve fee from the server state using the provided client.
 *
 * @param client - The client object used to make the request.
 * @returns A Promise that resolves to the owner reserve fee as a BigNumber.
 * @throws {Error} Throws an error if the owner reserve fee cannot be fetched.
 */
async function fetchOwnerReserveFee(client: Client): Promise<BigNumber> {
  const response = await client.request({ command: 'server_state' })
  const fee = response.result.state.validated_ledger?.reserve_inc

  if (fee == null) {
    return Promise.reject(new Error('Could not fetch Owner Reserve.'))
  }

  return new BigNumber(fee)
}

/**
 * Calculates the fee per transaction type.
 *
 * @param client - The client object.
 * @param tx - The transaction object.
 * @param [signersCount=0] - The number of signers (default is 0). Only used for multisigning.
 * @returns A promise that returns the fee.
 */

async function calculateFeePerTransactionType(
  client: Client,
  tx: Transaction,
  signersCount = 0,
): Promise<BigNumber> {
  const netFeeXRP = await getFeeXrp(client)
  const netFeeDrops = xrpToDrops(netFeeXRP)
  let baseFee = new BigNumber(netFeeDrops)

  const isSpecialTxCost = ['AccountDelete', 'AMMCreate'].includes(
    tx.TransactionType,
  )

  // EscrowFinish Transaction with Fulfillment
  if (tx.TransactionType === 'EscrowFinish' && tx.Fulfillment != null) {
    const fulfillmentBytesSize: number = Math.ceil(tx.Fulfillment.length / 2)
    // BaseFee × (33 + (Fulfillment size in bytes / 16))
    baseFee = new BigNumber(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- expected use of magic numbers
      scaleValue(netFeeDrops, 33 + fulfillmentBytesSize / 16),
    )
  } else if (isSpecialTxCost) {
    baseFee = await fetchOwnerReserveFee(client)
  } else if (tx.TransactionType === 'Batch') {
    const rawTxFees = await tx.RawTransactions.reduce(async (acc, rawTxn) => {
      const resolvedAcc = await acc
      const fee = await calculateFeePerTransactionType(
        client,
        rawTxn.RawTransaction,
      )
      return BigNumber.sum(resolvedAcc, fee)
    }, Promise.resolve(new BigNumber(0)))
    baseFee = BigNumber.sum(baseFee.times(2), rawTxFees)
  }

  /*
   * Multi-signed Transaction
   * BaseFee × (1 + Number of Signatures Provided)
   */
  if (signersCount > 0) {
    baseFee = BigNumber.sum(baseFee, scaleValue(netFeeDrops, signersCount))
  }

  const maxFeeDrops = xrpToDrops(client.maxFeeXRP)
  const totalFee = isSpecialTxCost
    ? baseFee
    : BigNumber.min(baseFee, maxFeeDrops)

  // Round up baseFee and return it as a string
  return totalFee.dp(0, BigNumber.ROUND_CEIL)
}

/**
 * Calculates the fee per transaction type and sets it in the transaction.
 *
 * @param client - The client object.
 * @param tx - The transaction object.
 * @param [signersCount=0] - The number of signers (default is 0). Only used for multisigning.
 * @returns A promise that resolves with void. Modifies the `tx` parameter to give it the calculated fee.
 */
export async function getTransactionFee(
  client: Client,
  tx: Transaction,
  signersCount = 0,
): Promise<void> {
  const fee = await calculateFeePerTransactionType(client, tx, signersCount)
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers, require-atomic-updates, no-param-reassign -- fine here
  tx.Fee = fee.toString(10)
}

/**
 * Scales the given value by multiplying it with the provided multiplier.
 *
 * @param value - The value to be scaled.
 * @param multiplier - The multiplier to scale the value.
 * @returns The scaled value as a string.
 */
function scaleValue(value, multiplier): string {
  return new BigNumber(value).times(multiplier).toString()
}

/**
 * Sets the latest validated ledger sequence for the transaction.
 *
 * @param client - The client object.
 * @param tx - The transaction object.
 * @returns A promise that resolves with void. Modifies the `tx` parameter setting `LastLedgerSequence`.
 */
export async function setLatestValidatedLedgerSequence(
  client: Client,
  tx: Transaction,
): Promise<void> {
  const ledgerSequence = await client.getLedgerIndex()
  // eslint-disable-next-line no-param-reassign -- param reassign is safe
  tx.LastLedgerSequence = ledgerSequence + LEDGER_OFFSET
}

/**
 * Checks for any blockers that prevent the deletion of an account.
 *
 * @param client - The client object.
 * @param tx - The transaction object.
 * @returns A promise that resolves with void if there are no blockers, or rejects with an XrplError if there are blockers.
 */
export async function checkAccountDeleteBlockers(
  client: Client,
  tx: Transaction,
): Promise<void> {
  const request: AccountObjectsRequest = {
    command: 'account_objects',
    account: tx.Account,
    ledger_index: 'validated',
    deletion_blockers_only: true,
  }
  const response = await client.request(request)
  return new Promise((resolve, reject) => {
    if (response.result.account_objects.length > 0) {
      reject(
        new XrplError(
          `Account ${tx.Account} cannot be deleted; there are Escrows, PayChannels, RippleStates, or Checks associated with the account.`,
          response.result.account_objects,
        ),
      )
    }
    resolve()
  })
}

/**
 * Replaces Amount with DeliverMax if needed.
 *
 * @param tx - The transaction object.
 * @throws ValidationError if Amount and DeliverMax are both provided but do not match.
 */
export function handleDeliverMax(tx: Payment): void {
  if (tx.DeliverMax != null) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed here
    if (tx.Amount == null) {
      // If only DeliverMax is provided, use it to populate the Amount field
      // eslint-disable-next-line no-param-reassign -- known RPC-level property
      tx.Amount = tx.DeliverMax
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed here
    if (tx.Amount != null && tx.Amount !== tx.DeliverMax) {
      throw new ValidationError(
        'PaymentTransaction: Amount and DeliverMax fields must be identical when both are provided',
      )
    }

    // eslint-disable-next-line no-param-reassign -- needed here
    delete tx.DeliverMax
  }
}

/**
 * Autofills all the relevant `x` fields.
 *
 * @param client - The client object.
 * @param tx - The transaction object.
 * @returns A promise that resolves with void if there are no blockers, or rejects with an XrplError if there are blockers.
 */
// eslint-disable-next-line complexity, max-lines-per-function -- needed here, lots to check
export async function autofillBatchTxn(
  client: Client,
  tx: Batch,
): Promise<void> {
  const accountSequences: Record<string, number> = {}

  for await (const rawTxn of tx.RawTransactions) {
    const txn = rawTxn.RawTransaction

    // Sequence processing
    if (txn.Sequence == null && txn.TicketSequence == null) {
      if (txn.Account in accountSequences) {
        txn.Sequence = accountSequences[txn.Account]
        accountSequences[txn.Account] += 1
      } else {
        const nextSequence = await getNextValidSequenceNumber(
          client,
          txn.Account,
        )
        const sequence =
          txn.Account === tx.Account ? nextSequence + 1 : nextSequence
        accountSequences[txn.Account] = sequence + 1
        txn.Sequence = sequence
      }
    }

    if (txn.Fee == null) {
      txn.Fee = '0'
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed for JS checks
    } else if (txn.Fee !== '0') {
      throw new XrplError('Must have `Fee of "0" in inner Batch transaction.')
    }

    if (txn.SigningPubKey == null) {
      txn.SigningPubKey = ''
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed for JS checks
    } else if (txn.SigningPubKey !== '') {
      throw new XrplError(
        'Must have `SigningPubKey` of "" in inner Batch transaction.',
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed for JS checks
    if (txn.TxnSignature != null) {
      throw new XrplError(
        'Must not have `TxnSignature` in inner Batch transaction.',
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- needed for JS checks
    if (txn.Signers != null) {
      throw new XrplError('Must not have `Signers` in inner Batch transaction.')
    }

    if (txn.NetworkID == null && txNeedsNetworkID(client)) {
      txn.NetworkID = client.networkID
    }
  }
}
