import { LedgerStream } from '../models/methods'
import { dropsToXrp, rippleTimeToISOTime } from '../utils'

function formatLedgerClose(ledgerClose: LedgerStream): object {
  return {
    baseFeeXRP: dropsToXrp(ledgerClose.fee_base),
    ledgerHash: ledgerClose.ledger_hash,
    ledgerVersion: ledgerClose.ledger_index,
    ledgerTimestamp: rippleTimeToISOTime(ledgerClose.ledger_time),
    reserveBaseXRP: dropsToXrp(ledgerClose.reserve_base),
    reserveIncrementXRP: dropsToXrp(ledgerClose.reserve_inc),
    transactionCount: ledgerClose.txn_count,
    validatedLedgerVersions: ledgerClose.validated_ledgers
  }
}

export {formatLedgerClose}
