/* eslint-disable no-param-reassign -- param reassign is safe */
/* eslint-disable no-bitwise -- flags require bitwise operations */

import { ValidationError } from '../../errors'
import {
  AccountRootFlagsInterface,
  AccountRootFlags,
} from '../ledger/AccountRoot'
import {
  AccountSetFlagsInterface,
  AccountSetTfFlags,
} from '../transactions/accountSet'
import { GlobalFlags } from '../transactions/common'
import {
  OfferCreateFlagsInterface,
  OfferCreateFlags,
} from '../transactions/offerCreate'
import { PaymentFlagsInterface, PaymentFlags } from '../transactions/payment'
import {
  PaymentChannelClaimFlagsInterface,
  PaymentChannelClaimFlags,
} from '../transactions/paymentChannelClaim'
import type { Transaction } from '../transactions/transaction'
import { TrustSetFlagsInterface, TrustSetFlags } from '../transactions/trustSet'
import {
  XChainModifyBridgeFlags,
  XChainModifyBridgeFlagsInterface,
} from '../transactions/XChainModifyBridge'

import { isFlagEnabled } from '.'

/**
 * Convert an AccountRoot Flags number into an interface for easy interpretation.
 *
 * @param flags - A number which is the bitwise and of all enabled AccountRootFlagsInterface.
 * @returns An interface with all flags as booleans.
 */
export function parseAccountRootFlags(
  flags: number,
): AccountRootFlagsInterface {
  const flagsInterface: AccountRootFlagsInterface = {}

  Object.keys(AccountRootFlags).forEach((flag) => {
    if (isFlagEnabled(flags, AccountRootFlags[flag])) {
      flagsInterface[flag] = true
    }
  })

  return flagsInterface
}

/**
 * Sets a transaction's flags to its numeric representation.
 *
 * @param tx - A transaction to set its flags to its numeric representation.
 */
export function setTransactionFlagsToNumber(tx: Transaction): void {
  if (tx.Flags == null) {
    tx.Flags = 0
    return
  }
  if (typeof tx.Flags === 'number') {
    return
  }

  switch (tx.TransactionType) {
    case 'AccountSet':
      tx.Flags = convertFlagsToNumber(tx.Flags, AccountSetTfFlags)
      return
    case 'OfferCreate':
      tx.Flags = convertFlagsToNumber(tx.Flags, OfferCreateFlags)
      return
    case 'PaymentChannelClaim':
      tx.Flags = convertFlagsToNumber(tx.Flags, PaymentChannelClaimFlags)
      return
    case 'Payment':
      tx.Flags = convertFlagsToNumber(tx.Flags, PaymentFlags)
      return
    case 'TrustSet':
      tx.Flags = convertFlagsToNumber(tx.Flags, TrustSetFlags)
      return
    case 'XChainModifyBridge':
      tx.Flags = convertFlagsToNumber(tx.Flags, XChainModifyBridgeFlags)
      return
    default:
      tx.Flags = 0
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- added ValidationError check for flagEnum
function convertFlagsToNumber(flags: GlobalFlags, flagEnum: any): number {
  return Object.keys(flags).reduce((resultFlags, flag) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe member access
    if (flagEnum[flag] == null) {
      throw new ValidationError(
        `flag ${flag} doesn't exist in flagEnum: ${JSON.stringify(flagEnum)}`,
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe member access
    return flags[flag] ? resultFlags | flagEnum[flag] : resultFlags
  }, 0)
}
