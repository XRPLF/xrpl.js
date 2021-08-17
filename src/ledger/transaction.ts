import * as utils from './utils'
import parseTransaction from './parse/transaction'
import {validate, errors} from '../common'
import {Connection} from '../client'
import {FormattedTransactionType} from '../transaction/types'
import {RippledError} from '../common/errors'
import {Client} from '..'
import { LedgerRequest } from '../models/methods'

export type TransactionOptions = {
  minLedgerVersion?: number
  maxLedgerVersion?: number
  includeRawTransaction?: boolean
}

type TransactionResponse = FormattedTransactionType & {
  hash: string
  ledger_index: number
  meta: any
  validated?: boolean
}

function attachTransactionDate(
  client: Client,
  tx: any
): Promise<TransactionResponse> {
  if (tx.result.date) {
    return Promise.resolve(tx)
  }

  const ledgerVersion = tx.result.ledger_index || tx.result.LedgerSequence

  if (!ledgerVersion) {
    return new Promise(() => {
      const error = new errors.NotFoundError(
        'Transaction has not been validated yet; try again later'
      )
      error.data = {
        details: '(ledger_index and LedgerSequence not found in tx)'
      }
      throw error
    })
  }

  const request: LedgerRequest = {
    command: 'ledger',
    ledger_index: ledgerVersion
  }

  return client
    .request(request)
    .then((data) => {
      const close_time = data.result.ledger.close_time
      if (typeof close_time === 'number') {
        return {...tx, result: {...tx.result, date: close_time}}
      }
      throw new errors.UnexpectedError('Ledger missing close_time')
    })
    .catch((error) => {
      if (error instanceof errors.UnexpectedError) {
        throw error
      }
      throw new errors.NotFoundError('Transaction ledger not found')
    })
}

function isTransactionInRange(tx: any, options: TransactionOptions) {
  return (
    (!options.minLedgerVersion ||
      tx.result.ledger_index >= options.minLedgerVersion) &&
    (!options.maxLedgerVersion || tx.result.ledger_index <= options.maxLedgerVersion)
  )
}

function convertError(
  connection: Connection,
  options: TransactionOptions,
  error: RippledError
): Promise<Error> {
  let shouldUseNotFoundError = false
  if (
    (error.data && error.data.error === 'txnNotFound') ||
    error.message === 'txnNotFound'
  ) {
    shouldUseNotFoundError = true
  }

  // In the future, we should deprecate this error, instead passing through the one from rippled.
  const _error = shouldUseNotFoundError
    ? new errors.NotFoundError('Transaction not found')
    : error

  if (_error instanceof errors.NotFoundError) {
    return utils
      .hasCompleteLedgerRange(
        connection,
        options.minLedgerVersion,
        options.maxLedgerVersion
      )
      .then((hasCompleteLedgerRange) => {
        if (!hasCompleteLedgerRange) {
          return utils
            .isPendingLedgerVersion(connection, options.maxLedgerVersion)
            .then((isPendingLedgerVersion) => {
              return isPendingLedgerVersion
                ? new errors.PendingLedgerVersionError()
                : new errors.MissingLedgerHistoryError()
            })
        }
        return _error
      })
  }
  return Promise.resolve(_error)
}

function formatResponse(
  options: TransactionOptions,
  tx: any
): FormattedTransactionType {
  if (tx.result.validated !== true || !isTransactionInRange(tx, options)) {
    throw new errors.NotFoundError('Transaction not found')
  }
  return parseTransaction(tx.result, options.includeRawTransaction)
}

async function getTransaction(
  this: Client,
  id: string,
  options: TransactionOptions = {}
): Promise<FormattedTransactionType> {
  validate.getTransaction({id, options})
  const _options = await utils.ensureLedgerVersion.call(this, options)
  try {
    const tx = await this.request({command: 'tx',
      transaction: id,
      binary: false
    })
    const txWithDate = await attachTransactionDate(this, tx)
    return formatResponse(_options, txWithDate)
  } catch (error) {
    throw await convertError(this.connection, _options, error)
  }
}

export default getTransaction
