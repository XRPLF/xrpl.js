import BigNumber from 'bignumber.js'
import { xAddressToClassicAddress, isValidXAddress } from 'ripple-address-codec'

import type { Client } from '..'
import { ValidationError, XrplError } from '../errors'
import { AccountInfoRequest, AccountObjectsRequest } from '../models/methods'
import { Transaction } from '../models/transactions'
import { setTransactionFlagsToNumber } from '../models/utils/flags'
import { xrpToDrops } from '../utils'

import getFeeXrp from './getFeeXrp'

// Expire unconfirmed transactions after 20 ledger versions, approximately 1 minute, by default
const LEDGER_OFFSET = 20
interface ClassicAccountAndTag {
  classicAccount: string
  tag: number | false | undefined
}

/**
 * Autofills fields in a transaction. This will set `Sequence`, `Fee`,
 * `lastLedgerSequence` according to the current state of the server this Client
 * is connected to. It also converts all X-Addresses to classic addresses and
 * flags interfaces into numbers.
 *
 * @example
 *
 * ```ts
 * const { Client } = require('xrpl')
 *
 * const client = new Client('wss://s.altnet.rippletest.net:51233')
 *
 * async function createAndAutofillTransaction() {
 *   const transaction = {
 *     TransactionType: 'Payment',
 *     Account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
 *     Destination: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
 *     Amount: '10000000' // 10 XRP in drops (1/1,000,000th of an XRP)
 *   }
 *
 *   try {
 *     const autofilledTransaction = await client.autofill(transaction)
 *     console.log(autofilledTransaction)
 *   } catch (error) {
 *     console.error(`Failed to autofill transaction: ${error}`)
 *   }
 * }
 *
 * createAndAutofillTransaction()
 * ```
 *
 * Autofill helps fill in fields which should be included in a transaction, but can be determined automatically
 * such as `LastLedgerSequence` and `Fee`. If you override one of the fields `autofill` changes, your explicit
 * values will be used instead. By default, this is done as part of `submit` and `submitAndWait` when you pass
 * in an unsigned transaction along with your wallet to be submitted.
 *
 * @param this - A client.
 * @param transaction - A {@link Transaction} in JSON format
 * @param signersCount - The expected number of signers for this transaction.
 * Only used for multisigned transactions.
 * @returns The autofilled transaction.
 */
async function autofill<T extends Transaction>(
  this: Client,
  transaction: T,
  signersCount?: number,
): Promise<T> {
  const tx = { ...transaction }

  setValidAddresses(tx)

  setTransactionFlagsToNumber(tx)

  const promises: Array<Promise<void>> = []
  if (tx.Sequence == null) {
    promises.push(setNextValidSequenceNumber(this, tx))
  }
  if (tx.Fee == null) {
    promises.push(calculateFeePerTransactionType(this, tx, signersCount))
  }
  if (tx.LastLedgerSequence == null) {
    promises.push(setLatestValidatedLedgerSequence(this, tx))
  }
  if (tx.TransactionType === 'AccountDelete') {
    promises.push(checkAccountDeleteBlockers(this, tx))
  }

  return Promise.all(promises).then(() => tx)
}

function setValidAddresses(tx: Transaction): void {
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

function convertToClassicAddress(tx: Transaction, fieldName: string): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- assignment is safe
  const account = tx[fieldName]
  if (typeof account === 'string') {
    const { classicAccount } = getClassicAccountAndTag(account)
    // eslint-disable-next-line no-param-reassign -- param reassign is safe
    tx[fieldName] = classicAccount
  }
}

async function setNextValidSequenceNumber(
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

async function fetchAccountDeleteFee(client: Client): Promise<BigNumber> {
  const response = await client.request({ command: 'server_state' })
  const fee = response.result.state.validated_ledger?.reserve_inc

  if (fee == null) {
    return Promise.reject(new Error('Could not fetch Owner Reserve.'))
  }

  return new BigNumber(fee)
}

async function calculateFeePerTransactionType(
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

function scaleValue(value, multiplier): string {
  return new BigNumber(value).times(multiplier).toString()
}

async function setLatestValidatedLedgerSequence(
  client: Client,
  tx: Transaction,
): Promise<void> {
  const ledgerSequence = await client.getLedgerIndex()
  // eslint-disable-next-line no-param-reassign -- param reassign is safe
  tx.LastLedgerSequence = ledgerSequence + LEDGER_OFFSET
}

async function checkAccountDeleteBlockers(
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

export default autofill
