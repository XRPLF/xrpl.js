import * as _ from 'lodash'
import transactionParser from 'ripple-lib-transactionparser'
import BigNumber from 'bignumber.js'
import * as common from '../../common'
import parseAmount from './amount'

import {Amount, Memo} from '../../common/types/objects'

function adjustQualityForXRP(
  quality: string,
  takerGetsCurrency: string,
  takerPaysCurrency: string
) {
  // quality = takerPays.value/takerGets.value
  // using drops (1e-6 XRP) for XRP values
  const numeratorShift = takerPaysCurrency === 'XRP' ? -6 : 0
  const denominatorShift = takerGetsCurrency === 'XRP' ? -6 : 0
  const shift = numeratorShift - denominatorShift
  return shift === 0
    ? quality
    : new BigNumber(quality).shiftedBy(shift).toString()
}

function parseQuality(quality?: number | null): number | undefined {
  if (typeof quality !== 'number') {
    return undefined
  }
  return new BigNumber(quality).shiftedBy(-9).toNumber()
}

function parseTimestamp(rippleTime?: number | null): string | undefined {
  if (typeof rippleTime !== 'number') {
    return undefined
  }
  return common.rippleTimeToISO8601(rippleTime)
}

function removeEmptyCounterparty(amount) {
  if (amount.counterparty === '') {
    delete amount.counterparty
  }
}

function removeEmptyCounterpartyInBalanceChanges(balanceChanges) {
  _.forEach(balanceChanges, changes => {
    _.forEach(changes, removeEmptyCounterparty)
  })
}

function removeEmptyCounterpartyInOrderbookChanges(orderbookChanges) {
  _.forEach(orderbookChanges, changes => {
    _.forEach(changes, change => {
      _.forEach(change, removeEmptyCounterparty)
    })
  })
}

function isPartialPayment(tx: any) {
  return (tx.Flags & common.txFlags.Payment.PartialPayment) !== 0
}

function parseDeliveredAmount(tx: any): Amount | void {
  if (
    tx.TransactionType !== 'Payment' ||
    tx.meta.TransactionResult !== 'tesSUCCESS'
  ) {
    return undefined
  }

  if (tx.meta.delivered_amount && tx.meta.delivered_amount === 'unavailable') {
    return undefined
  }

  // parsable delivered_amount
  if (tx.meta.delivered_amount) {
    return parseAmount(tx.meta.delivered_amount)
  }

  // DeliveredAmount only present on partial payments
  if (tx.meta.DeliveredAmount) {
    return parseAmount(tx.meta.DeliveredAmount)
  }

  // no partial payment flag, use tx.Amount
  if (tx.Amount && !isPartialPayment(tx)) {
    return parseAmount(tx.Amount)
  }

  // DeliveredAmount field was introduced at
  // ledger 4594095 - after that point its absence
  // on a tx flagged as partial payment indicates
  // the full amount was transferred. The amount
  // transferred with a partial payment before
  // that date must be derived from metadata.
  if (tx.Amount && tx.ledger_index > 4594094) {
    return parseAmount(tx.Amount)
  }

  return undefined
}

function parseOutcome(tx: any): any | undefined {
  const metadata = tx.meta || tx.metaData
  if (!metadata) {
    return undefined
  }
  const balanceChanges = transactionParser.parseBalanceChanges(metadata)
  const orderbookChanges = transactionParser.parseOrderbookChanges(metadata)
  const channelChanges = transactionParser.parseChannelChanges(metadata)

  removeEmptyCounterpartyInBalanceChanges(balanceChanges)
  removeEmptyCounterpartyInOrderbookChanges(orderbookChanges)

  return common.removeUndefined({
    result: tx.meta.TransactionResult,
    timestamp: parseTimestamp(tx.date),
    fee: common.dropsToXrp(tx.Fee),
    balanceChanges: balanceChanges,
    orderbookChanges: orderbookChanges,
    channelChanges: channelChanges,
    ledgerVersion: tx.ledger_index,
    indexInLedger: tx.meta.TransactionIndex,
    deliveredAmount: parseDeliveredAmount(tx)
  })
}

function hexToString(hex: string): string | undefined {
  return hex ? Buffer.from(hex, 'hex').toString('utf-8') : undefined
}

function parseMemos(tx: any): Array<Memo> | undefined {
  if (!Array.isArray(tx.Memos) || tx.Memos.length === 0) {
    return undefined
  }
  return tx.Memos.map(m => {
    return common.removeUndefined({
      type: m.Memo.parsed_memo_type || hexToString(m.Memo.MemoType),
      format: m.Memo.parsed_memo_format || hexToString(m.Memo.MemoFormat),
      data: m.Memo.parsed_memo_data || hexToString(m.Memo.MemoData)
    })
  })
}

export {
  parseQuality,
  parseOutcome,
  parseMemos,
  hexToString,
  parseTimestamp,
  adjustQualityForXRP,
  isPartialPayment
}
