/* eslint-disable no-param-reassign -- param reassign is safe */
/* eslint-disable no-bitwise -- flags require bitwise operations */

import { ValidationError } from '../../errors'
import {
  AccountRootFlagsInterface,
  AccountRootFlags,
} from '../ledger/AccountRoot'
import { AccountSetTfFlags } from '../transactions/accountSet'
import { AMMDepositFlags } from '../transactions/AMMDeposit'
import { AMMWithdrawFlags } from '../transactions/AMMWithdraw'
import { GlobalFlags } from '../transactions/common'
import { OfferCreateFlags } from '../transactions/offerCreate'
import { PaymentFlags } from '../transactions/payment'
import { PaymentChannelClaimFlags } from '../transactions/paymentChannelClaim'
import type { Transaction } from '../transactions/transaction'
import { TrustSetFlags } from '../transactions/trustSet'

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

  // If we use keys all will be strings and enums are reversed during transpilation
  Object.values(AccountRootFlags).forEach((flag) => {
    if (
      typeof flag === 'string' &&
      isFlagEnabled(flags, AccountRootFlags[flag])
    ) {
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
    case 'AMMDeposit':
      tx.Flags = convertFlagsToNumber(tx.Flags, AMMDepositFlags)
      return
    case 'AMMWithdraw':
      tx.Flags = convertFlagsToNumber(tx.Flags, AMMWithdrawFlags)
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
