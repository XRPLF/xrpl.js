import BigNumber from 'bignumber.js'
import { xAddressToClassicAddress, isValidXAddress } from 'ripple-address-codec'

import type { Client } from '..'
import { ValidationError, XrplError } from '../errors'
import { AccountInfoRequest, AccountObjectsRequest } from '../models/methods'
import { Transaction } from '../models/transactions'
import { xrpToDrops } from '../utils'

import getFeeXrp from './getFeeXrp'

// Expire unconfirmed transactions after 20 ledger versions, approximately 1 minute, by default
const LEDGER_OFFSET = 20
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
  const { classicAccount, tag } = getClassicAccountAndTag(tx[accountField])
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
 * @param Account - The account address.
 * @param [expectedTag] - The expected tag for the account address.
 * @returns The classic account and tag.
 * @throws {ValidationError} If the address includes a tag that does not match the tag specified in the transaction.
 */
function getClassicAccountAndTag(
  Account: string,
  expectedTag?: number,
): ClassicAccountAndTag {
  if (isValidXAddress(Account)) {
    const classic = xAddressToClassicAddress(Account)
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
    classicAccount: Account,
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- assignment is safe
  const account = tx[fieldName]
  if (typeof account === 'string') {
    const { classicAccount } = getClassicAccountAndTag(account)
    // eslint-disable-next-line no-param-reassign -- param reassign is safe
    tx[fieldName] = classicAccount
  }
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
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: tx.Account,
    ledger_index: 'current',
  }
  const data = await client.request(request)
  // eslint-disable-next-line no-param-reassign, require-atomic-updates -- param reassign is safe with no race condition
  tx.Sequence = data.result.account_data.Sequence
}

/**
 * Fetches the account deletion fee from the server state using the provided client.
 *
 * @param client - The client object used to make the request.
 * @returns A Promise that resolves to the account deletion fee as a BigNumber.
 * @throws {Error} Throws an error if the account deletion fee cannot be fetched.
 */
async function fetchAccountDeleteFee(client: Client): Promise<BigNumber> {
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
 * @param [signersCount=0] - The number of signers (default is 0).
 * @returns A promise that resolves with void.
 */
export async function calculateFeePerTransactionType(
  client: Client,
  tx: Transaction,
  signersCount = 0,
): Promise<void> {
  // netFee is usually 0.00001 XRP (10 drops)
  const netFeeXRP = await getFeeXrp(client)
  const netFeeDrops = xrpToDrops(netFeeXRP)
  let baseFee = new BigNumber(netFeeDrops)

  // EscrowFinish Transaction with Fulfillment
  if (tx.TransactionType === 'EscrowFinish' && tx.Fulfillment != null) {
    const fulfillmentBytesSize: number = Math.ceil(tx.Fulfillment.length / 2)
    // 10 drops × (33 + (Fulfillment size in bytes / 16))
    const product = new BigNumber(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- expected use of magic numbers
      scaleValue(netFeeDrops, 33 + fulfillmentBytesSize / 16),
    )
    baseFee = product.dp(0, BigNumber.ROUND_CEIL)
  }

  // AccountDelete Transaction
  if (tx.TransactionType === 'AccountDelete') {
    baseFee = await fetchAccountDeleteFee(client)
  }

  /*
   * Multi-signed Transaction
   * 10 drops × (1 + Number of Signatures Provided)
   */
  if (signersCount > 0) {
    baseFee = BigNumber.sum(baseFee, scaleValue(netFeeDrops, 1 + signersCount))
  }

  const maxFeeDrops = xrpToDrops(client.maxFeeXRP)
  const totalFee =
    tx.TransactionType === 'AccountDelete'
      ? baseFee
      : BigNumber.min(baseFee, maxFeeDrops)

  // Round up baseFee and return it as a string
  // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-magic-numbers -- param reassign is safe, base 10 magic num
  tx.Fee = totalFee.dp(0, BigNumber.ROUND_CEIL).toString(10)
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
 * @returns A promise that resolves with void.
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
