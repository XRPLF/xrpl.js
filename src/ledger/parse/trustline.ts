import * as assert from 'assert'
import {parseQuality, parseMemos} from './utils'
import {txFlags} from '../../common'
import {removeUndefined} from '../../utils'
const flags = txFlags.TrustSet

function parseFlag(flagsValue, trueValue, falseValue) {
  if (flagsValue & trueValue) {
    return true
  }
  if (flagsValue & falseValue) {
    return false
  }
  return undefined
}

function parseTrustline(tx: any): object {
  assert.ok(tx.TransactionType === 'TrustSet')

  return removeUndefined({
    limit: tx.LimitAmount.value,
    currency: tx.LimitAmount.currency,
    counterparty: tx.LimitAmount.issuer,
    memos: parseMemos(tx),
    qualityIn: parseQuality(tx.QualityIn),
    qualityOut: parseQuality(tx.QualityOut),
    ripplingDisabled: parseFlag(
      tx.Flags,
      flags.SetNoRipple,
      flags.ClearNoRipple
    ),
    frozen: parseFlag(tx.Flags, flags.SetFreeze, flags.ClearFreeze),
    authorized: parseFlag(tx.Flags, flags.SetAuth, 0)
  })
}

export default parseTrustline
