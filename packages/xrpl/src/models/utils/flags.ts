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
      tx.Flags = convertAccountSetFlagsToNumber(tx.Flags)
      return
    case 'OfferCreate':
      tx.Flags = convertOfferCreateFlagsToNumber(tx.Flags)
      return
    case 'PaymentChannelClaim':
      tx.Flags = convertPaymentChannelClaimFlagsToNumber(tx.Flags)
      return
    case 'Payment':
      tx.Flags = convertPaymentTransactionFlagsToNumber(tx.Flags)
      return
    case 'TrustSet':
      tx.Flags = convertTrustSetFlagsToNumber(tx.Flags)
      return
    default:
      tx.Flags = 0
  }
}

function convertAccountSetFlagsToNumber(
  flags: AccountSetFlagsInterface,
): number {
  return reduceFlags(flags, AccountSetTfFlags)
}

function convertOfferCreateFlagsToNumber(
  flags: OfferCreateFlagsInterface,
): number {
  return reduceFlags(flags, OfferCreateFlags)
}

function convertPaymentChannelClaimFlagsToNumber(
  flags: PaymentChannelClaimFlagsInterface,
): number {
  return reduceFlags(flags, PaymentChannelClaimFlags)
}

function convertPaymentTransactionFlagsToNumber(
  flags: PaymentFlagsInterface,
): number {
  return reduceFlags(flags, PaymentFlags)
}

function convertTrustSetFlagsToNumber(flags: TrustSetFlagsInterface): number {
  return reduceFlags(flags, TrustSetFlags)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- added ValidationError check for flagEnum
function reduceFlags(flags: GlobalFlags, flagEnum: any): number {
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
