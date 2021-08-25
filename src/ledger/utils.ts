import * as _ from 'lodash'
import * as assert from 'assert'
import * as common from '../common'
import {Connection} from '../client'
import {FormattedTransactionType} from '../transaction/types'
import {Issue} from '../common/types/objects'
import {Client} from '..'
import {AccountInfoRequest} from '../models/methods'
import {dropsToXrp} from '..'

export type RecursiveData = {
  marker: string
  results: Array<any>
}

export type Getter = (marker?: string, limit?: number) => Promise<RecursiveData>

function clamp(value: number, min: number, max: number): number {
  assert.ok(min <= max, 'Illegal clamp bounds')
  return Math.min(Math.max(value, min), max)
}

async function getXRPBalance(
  client: Client,
  address: string,
  ledgerVersion?: number
): Promise<string> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: address,
    ledger_index: ledgerVersion
  }
  const data = await client
    .request(request)
  return dropsToXrp(data.result.account_data.Balance)
}

// If the marker is omitted from a response, you have reached the end
async function getRecursiveRecur(
  getter: Getter,
  marker: string | undefined,
  limit: number
): Promise<Array<any>> {
  const data = await getter(marker, limit)
  const remaining = limit - data.results.length
  if (remaining > 0 && data.marker != null) {
    return getRecursiveRecur(getter, data.marker, remaining).then((results) => data.results.concat(results)
    )
  }
  return data.results.slice(0, limit)
}

function getRecursive(getter: Getter, limit?: number): Promise<Array<any>> {
  return getRecursiveRecur(getter, undefined, limit || Infinity)
}

function renameCounterpartyToIssuer<T>(
  obj: T & {counterparty?: string; issuer?: string}
): T & {issuer?: string} {
  const issuer =
    obj.counterparty != null
      ? obj.counterparty
      : obj.issuer != null
      ? obj.issuer
      : undefined
  const withIssuer = Object.assign({}, obj, {issuer})
  delete withIssuer.counterparty
  return withIssuer
}

export type RequestBookOffersArgs = {taker_gets: Issue; taker_pays: Issue}

function renameCounterpartyToIssuerInOrder(order: RequestBookOffersArgs) {
  const taker_gets = renameCounterpartyToIssuer(order.taker_gets)
  const taker_pays = renameCounterpartyToIssuer(order.taker_pays)
  const changes = {taker_gets, taker_pays}
  return Object.assign({}, order, _.omitBy(changes, value => value == null))
}

function signum(num) {
  return num === 0 ? 0 : num > 0 ? 1 : -1
}

/**
 *  Order two rippled transactions based on their ledger_index.
 *  If two transactions took place in the same ledger, sort
 *  them based on TransactionIndex
 *  See: https://developers.ripple.com/transaction-metadata.html
 */
function compareTransactions(
  first: FormattedTransactionType,
  second: FormattedTransactionType
): number {
  if (!first.outcome || !second.outcome) {
    return 0
  }
  if (first.outcome.ledgerVersion === second.outcome.ledgerVersion) {
    return signum(first.outcome.indexInLedger - second.outcome.indexInLedger)
  }
  return first.outcome.ledgerVersion < second.outcome.ledgerVersion ? -1 : 1
}

async function isPendingLedgerVersion(
  client: Client,
  maxLedgerVersion?: number
): Promise<boolean> {
  const response = await client.request({
    command: 'ledger',
    ledger_index: 'validated'
  })
  const ledgerVersion = response.result.ledger_index
  return ledgerVersion < (maxLedgerVersion || 0)
}

async function ensureLedgerVersion(this: Client, options: any): Promise<object> {
  if (
    Boolean(options) &&
    options.ledgerVersion != null &&
    options.ledgerVersion !== null
  ) {
    return Promise.resolve(options)
  }
  const response = await this.request({
    command: 'ledger',
    ledger_index: 'validated'
  })
  const ledgerVersion = response.result.ledger_index
  return Object.assign({}, options, { ledgerVersion })
}

export {
  getXRPBalance,
  ensureLedgerVersion,
  compareTransactions,
  renameCounterpartyToIssuer,
  renameCounterpartyToIssuerInOrder,
  getRecursive,
  isPendingLedgerVersion,
  clamp,
  common,
  Connection
}
