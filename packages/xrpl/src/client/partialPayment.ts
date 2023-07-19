import BigNumber from 'bignumber.js'
import { decode } from 'ripple-binary-codec'

import type {
  AccountTxResponse,
  Response,
  ResponseWarning,
  TransactionEntryResponse,
  TransactionStream,
  TxResponse,
} from '..'
import type { Amount } from '../models/common'
import { PaymentFlags, Transaction } from '../models/transactions'
import type { TransactionMetadata } from '../models/transactions/metadata'
import { isFlagEnabled } from '../models/utils'

const WARN_PARTIAL_PAYMENT_CODE = 2001

function amountsEqual(amt1: Amount, amt2: Amount): boolean {
  if (typeof amt1 === 'string' && typeof amt2 === 'string') {
    return amt1 === amt2
  }

  if (typeof amt1 === 'string' || typeof amt2 === 'string') {
    return false
  }

  const aValue = new BigNumber(amt1.value)
  const bValue = new BigNumber(amt2.value)

  return (
    amt1.currency === amt2.currency &&
    amt1.issuer === amt2.issuer &&
    aValue.isEqualTo(bValue)
  )
}

function isPartialPayment(
  tx?: Transaction,
  metadata?: TransactionMetadata | string,
): boolean {
  if (tx == null || metadata == null || tx.TransactionType !== 'Payment') {
    return false
  }

  let meta = metadata
  if (typeof meta === 'string') {
    if (meta === 'unavailable') {
      return false
    }

    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- binary-codec typing */
    meta = decode(meta) as unknown as TransactionMetadata
  }

  const tfPartial =
    typeof tx.Flags === 'number'
      ? isFlagEnabled(tx.Flags, PaymentFlags.tfPartialPayment)
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
  /* eslint-disable @typescript-eslint/consistent-type-assertions -- Request type is known at runtime from command */
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
  /* eslint-enable @typescript-eslint/consistent-type-assertions */
}

/**
 * Checks a response for a partial payment.
 *
 * @param command - Command from the request, tells us what response to expect.
 * @param response - Response to check for a partial payment.
 */
export function handlePartialPayment(
  command: string,
  response: Response,
): void {
  if (hasPartialPayment(command, response)) {
    const warnings: ResponseWarning[] = response.warnings ?? []

    const warning = {
      id: WARN_PARTIAL_PAYMENT_CODE,
      message: 'This response contains a Partial Payment',
    }

    warnings.push(warning)

    response.warnings = warnings
  }
}

/**
 * Check a transaction from a subscription stream for partial payment.
 *
 * @param stream - Stream Transaction to check for partial payment.
 * @param log - The method used for logging by the connection (to report the partial payment).
 */
export function handleStreamPartialPayment(
  stream: TransactionStream,
  log: (id: string, message: string) => void,
): void {
  if (isPartialPayment(stream.transaction, stream.meta)) {
    const warnings = stream.warnings ?? []

    const warning = {
      id: WARN_PARTIAL_PAYMENT_CODE,
      message: 'This response contains a Partial Payment',
    }

    warnings.push(warning)

    /* eslint-disable-next-line no-param-reassign -- Handles the case where there are no warnings */
    stream.warnings = warnings

    log('Partial payment received', JSON.stringify(stream))
  }
}
