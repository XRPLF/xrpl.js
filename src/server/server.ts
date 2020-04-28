import * as common from '../common'
import {RippleAPI} from '..'

function isConnected(this: RippleAPI): boolean {
  return this.connection.isConnected()
}

function getLedgerVersion(this: RippleAPI): Promise<number> {
  return this.connection.getLedgerVersion()
}

async function connect(this: RippleAPI): Promise<void> {
  return this.connection.connect()
}

async function disconnect(this: RippleAPI): Promise<void> {
  // backwards compatibility: connection.disconnect() can return a number, but
  // this method returns nothing. SO we await but don't return any result.
  await this.connection.disconnect()
}

function formatLedgerClose(ledgerClose: any): object {
  return {
    baseFeeXRP: common.dropsToXrp(ledgerClose.fee_base),
    ledgerHash: ledgerClose.ledger_hash,
    ledgerVersion: ledgerClose.ledger_index,
    ledgerTimestamp: common.rippleTimeToISO8601(ledgerClose.ledger_time),
    reserveBaseXRP: common.dropsToXrp(ledgerClose.reserve_base),
    reserveIncrementXRP: common.dropsToXrp(ledgerClose.reserve_inc),
    transactionCount: ledgerClose.txn_count,
    validatedLedgerVersions: ledgerClose.validated_ledgers
  }
}

export {connect, disconnect, isConnected, getLedgerVersion, formatLedgerClose}
