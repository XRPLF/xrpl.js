/* @flow */

import * as _ from 'lodash'
import * as utils from './utils'
import parseTransaction from './parse/transaction'
import {validate, errors} from '../common'
import type {Connection} from '../common'
import type {TransactionType, TransactionOptions} from './transaction-types'

function attachTransactionDate(connection: Connection, tx: Object
): Promise<TransactionType> {
  if (tx.date) {
    return Promise.resolve(tx)
  }

  const ledgerVersion = tx.ledger_index || tx.LedgerSequence

  if (!ledgerVersion) {
    return new Promise(() => {
      throw new errors.NotFoundError(
        'ledger_index and LedgerSequence not found in tx')
    })
  }

  const request = {
    command: 'ledger',
    ledger_index: ledgerVersion
  }

  return connection.request(request).then(data => {
    if (typeof data.ledger.close_time === 'number') {
      return _.assign({date: data.ledger.close_time}, tx)
    }
    throw new errors.UnexpectedError('Ledger missing close_time')
  }).catch(error => {
    if (error instanceof errors.UnexpectedError) {
      throw error
    }
    throw new errors.NotFoundError('Transaction ledger not found')
  })
}

function isTransactionInRange(tx: Object, options: TransactionOptions) {
  return (!options.minLedgerVersion
          || tx.ledger_index >= options.minLedgerVersion)
      && (!options.maxLedgerVersion
          || tx.ledger_index <= options.maxLedgerVersion)
}

function convertError(connection: Connection, options: TransactionOptions,
  error: Error
): Promise<Error> {
  const _error = (error.message === 'txnNotFound') ?
    new errors.NotFoundError('Transaction not found') : error
  if (_error instanceof errors.NotFoundError) {
    return utils.hasCompleteLedgerRange(connection, options.minLedgerVersion,
      options.maxLedgerVersion).then(hasCompleteLedgerRange => {
      if (!hasCompleteLedgerRange) {
        return utils.isPendingLedgerVersion(
          connection, options.maxLedgerVersion)
          .then(isPendingLedgerVersion => {
            return isPendingLedgerVersion ?
              new errors.PendingLedgerVersionError() :
              new errors.MissingLedgerHistoryError()
          })
      }
      return _error
    })
  }
  return Promise.resolve(_error)
}

function formatResponse(options: TransactionOptions, tx: TransactionType
): TransactionType {
  if (tx.validated !== true || !isTransactionInRange(tx, options)) {
    throw new errors.NotFoundError('Transaction not found')
  }
  return parseTransaction(tx)
}

function getTransaction(id: string, options: TransactionOptions = {}
): Promise<TransactionType> {
  validate.getTransaction({id, options})

  const request = {
    command: 'tx',
    transaction: id,
    binary: false
  }

  return utils.ensureLedgerVersion.call(this, options).then(_options => {
    return this.connection.request(request).then(tx =>
      attachTransactionDate(this.connection, tx)
    ).then(_.partial(formatResponse, _options))
      .catch(error => {
        return convertError(this.connection, _options, error).then(_error => {
          throw _error
        })
      })
  })
}

export default getTransaction
