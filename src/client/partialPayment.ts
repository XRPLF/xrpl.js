import { decode } from 'ripple-binary-codec'
import { AccountTxResponse, Response, TxResponse } from '..'
import { Amount } from '../models/common'
import { PaymentTransactionFlags, Transaction } from '../models/transactions'
import TransactionMetadata from '../models/transactions/metadata'
import { isFlagEnabled } from '../models/utils'

function amountsEqual(a: Amount, b: Amount): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b
  }

  if (typeof a === 'string' || typeof b === 'string') {
    return false
  }

  return (
    a.currency === b.currency && a.issuer === b.issuer && a.value === b.value
  )
}

function isPartialPayment(
  tx?: Transaction | string,
  meta?: TransactionMetadata | string,
): boolean {
  if (tx == null || meta == null) {
    return false
  }

  if (typeof tx === 'string') {
    tx = decode(tx) as unknown as Transaction
  }

  if (tx.TransactionType !== 'Payment') {
    return false
  }

  if (typeof meta === 'string') {
    if (meta === 'unavailable') {
      return false
    }

    meta = decode(meta) as unknown as TransactionMetadata
  }

  const tfPartial =
    typeof tx.Flags === 'number'
      ? isFlagEnabled(tx.Flags, PaymentTransactionFlags.tfPartialPayment)
      : tx.Flags?.tfPartialPayment

  if (!tfPartial) {
    return false
  }

  const delivered = meta.delivered_amount
  const amount = tx.Amount

  if (delivered === undefined) {
    return false
  }

  return amountsEqual(delivered, amount)
}

function txHasPartialPayment(response: TxResponse): boolean {
  return isPartialPayment(response.result, response.result.meta)
}

function accountTxHasPartialPayment(response: AccountTxResponse): boolean {
  return response.result.transactions.some((tx) =>
    isPartialPayment(tx.tx ?? tx.tx_blob, tx.meta),
  )
}

function hasPartialPayment(command: string, response: Response): boolean {
  switch (command) {
    case 'tx':
      return txHasPartialPayment(response as TxResponse)
    case 'account_tx':
      return accountTxHasPartialPayment(response as AccountTxResponse)

    default:
      return false
  }
}

export default function handlePartialPayment(
  command: string,
  response: Response,
): void {
  if (hasPartialPayment(command, response)) {
    const warnings = response.warnings ?? []

    const warning = {
      id: 3838,
      message: 'This response contains a Partial Payment',
    }

    warnings.push(warning)

    response.warnings = warnings
  }
}
