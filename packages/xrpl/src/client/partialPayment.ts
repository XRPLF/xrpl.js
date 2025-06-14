import BigNumber from 'bignumber.js'
import { decode } from 'ripple-binary-codec'

import type {
  TransactionEntryResponse,
  TransactionStream,
  TransactionV1Stream,
  TxResponse,
} from '..'
import type {
  Amount,
  IssuedCurrency,
  APIVersion,
  DEFAULT_API_VERSION,
  MPTAmount,
} from '../models/common'
import type {
  AccountTxTransaction,
  RequestResponseMap,
} from '../models/methods'
import { AccountTxVersionResponseMap } from '../models/methods/accountTx'
import { BaseRequest, BaseResponse } from '../models/methods/baseMethod'
import { PaymentFlags, Transaction, isMPTAmount } from '../models/transactions'
import type { TransactionMetadata } from '../models/transactions/metadata'
import { isFlagEnabled } from '../models/utils'

const WARN_PARTIAL_PAYMENT_CODE = 2001

/* eslint-disable complexity -- check different token types */
/* eslint-disable @typescript-eslint/consistent-type-assertions -- known currency type */
function amountsEqual(
  amt1: Amount | MPTAmount,
  amt2: Amount | MPTAmount,
): boolean {
  // Compare XRP
  if (typeof amt1 === 'string' && typeof amt2 === 'string') {
    return amt1 === amt2
  }

  if (typeof amt1 === 'string' || typeof amt2 === 'string') {
    return false
  }

  // Compare MPTs
  if (isMPTAmount(amt1) && isMPTAmount(amt2)) {
    const aValue = new BigNumber(amt1.value)
    const bValue = new BigNumber(amt2.value)

    return (
      amt1.mpt_issuance_id === amt2.mpt_issuance_id && aValue.isEqualTo(bValue)
    )
  }

  if (isMPTAmount(amt1) || isMPTAmount(amt2)) {
    return false
  }

  // Compare issued currency (IOU)
  const aValue = new BigNumber(amt1.value)
  const bValue = new BigNumber(amt2.value)

  return (
    (amt1 as IssuedCurrency).currency === (amt2 as IssuedCurrency).currency &&
    (amt1 as IssuedCurrency).issuer === (amt2 as IssuedCurrency).issuer &&
    aValue.isEqualTo(bValue)
  )
}
/* eslint-enable complexity */
/* eslint-enable @typescript-eslint/consistent-type-assertions */

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

  const amount = tx.DeliverMax ?? tx.Amount

  if (delivered === undefined) {
    return false
  }

  return !amountsEqual(delivered, amount)
}

function txHasPartialPayment(response: TxResponse): boolean {
  return isPartialPayment(response.result.tx_json, response.result.meta)
}

function txEntryHasPartialPayment(response: TransactionEntryResponse): boolean {
  return isPartialPayment(response.result.tx_json, response.result.metadata)
}

function accountTxHasPartialPayment<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
>(response: AccountTxVersionResponseMap<Version>): boolean {
  const { transactions } = response.result
  const foo = transactions.some((tx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- required to check API version model
    if (tx.tx_json != null) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- use API v2 model
      const transaction = tx as AccountTxTransaction
      return isPartialPayment(transaction.tx_json, transaction.meta)
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- use API v1 model
    const transaction = tx as AccountTxTransaction<1>
    return isPartialPayment(transaction.tx, transaction.meta)
  })
  return foo
}

function hasPartialPayment<
  R extends BaseRequest,
  V extends APIVersion = typeof DEFAULT_API_VERSION,
  T = RequestResponseMap<R, V>,
>(command: string, response: T): boolean {
  /* eslint-disable @typescript-eslint/consistent-type-assertions -- Request type is known at runtime from command */
  switch (command) {
    case 'tx':
      return txHasPartialPayment(response as TxResponse)
    case 'transaction_entry':
      return txEntryHasPartialPayment(response as TransactionEntryResponse)
    case 'account_tx':
      return accountTxHasPartialPayment(
        response as AccountTxVersionResponseMap<V>,
      )
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
export function handlePartialPayment<
  R extends BaseRequest,
  T = RequestResponseMap<R, APIVersion>,
>(command: string, response: T): void {
  if (hasPartialPayment(command, response)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We are checking dynamically and safely.
    const warnings = (response as BaseResponse).warnings ?? []

    const warning = {
      id: WARN_PARTIAL_PAYMENT_CODE,
      message: 'This response contains a Partial Payment',
    }

    warnings.push(warning)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- We are checking dynamically and safely.
    // @ts-expect-error -- We are checking dynamically and safely.
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
  stream: TransactionStream | TransactionV1Stream,
  log: (id: string, message: string) => void,
): void {
  if (isPartialPayment(stream.tx_json ?? stream.transaction, stream.meta)) {
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
