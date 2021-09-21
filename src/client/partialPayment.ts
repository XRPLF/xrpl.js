import BigNumber from 'bignumber.js'
import { decode } from 'ripple-binary-codec'
import {
  AccountTxResponse,
  Response,
  TransactionEntryResponse,
  TransactionStream,
  TxResponse,
} from '..'
import { Amount } from '../models/common'
import { PaymentTransactionFlags, Transaction } from '../models/transactions'
import TransactionMetadata from '../models/transactions/metadata'
import { isFlagEnabled } from '../models/utils'

const WARN_PARTIAL_PAYMENT_CODE = 2001

function amountsEqual(a: Amount, b: Amount): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b
  }

  if (typeof a === 'string' || typeof b === 'string') {
    return false
  }

  const aValue = new BigNumber(a.value)
  const bValue = new BigNumber(b.value)

  return (
    a.currency === b.currency &&
    a.issuer === b.issuer &&
    aValue.isEqualTo(bValue)
  )
}

function isPartialPayment(
  tx?: Transaction,
  meta?: TransactionMetadata | string,
): boolean {
  if (tx == null || meta == null || tx.TransactionType !== 'Payment') {
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

  return !amountsEqual(delivered, amount)
}

function txHasPartialPayment(response: TxResponse): boolean {
  return isPartialPayment(response.result, response.result.meta)
}

function txEntryHasPartialPayment(response: TransactionEntryResponse): boolean {
  return isPartialPayment(response.result.tx_json, response.result.metadata)
}

function accountTxHasPartialPayment(response: AccountTxResponse): boolean {
  const { transactions } = response.result
  const foo = transactions.some((tx) => isPartialPayment(tx.tx, tx.meta))
  return foo
}

function hasPartialPayment(command: string, response: Response): boolean {
  switch (command) {
    case 'tx':
      return txHasPartialPayment(response as TxResponse)
    case 'transaction_entry':
      return txEntryHasPartialPayment(response as TransactionEntryResponse)
    case 'account_tx':
      return accountTxHasPartialPayment(response as AccountTxResponse)
    default:
      return false
  }
}

export function handlePartialPayment(
  command: string,
  response: Response,
): void {
  if (hasPartialPayment(command, response)) {
    const warnings = response.warnings ?? []

    const warning = {
      id: WARN_PARTIAL_PAYMENT_CODE,
      message: 'This response contains a Partial Payment',
    }

    warnings.push(warning)

    response.warnings = warnings
  }
}

export function handleStreamPartialPayment(stream: TransactionStream): void {
  if (isPartialPayment(stream.transaction, stream.meta)) {
    const warnings = stream.warnings ?? []

    const warning = {
      id: WARN_PARTIAL_PAYMENT_CODE,
      message: 'This response contains a Partial Payment',
    }

    warnings.push(warning)

    stream.warnings = warnings
  }
}
