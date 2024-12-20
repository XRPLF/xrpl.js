/* eslint-disable no-bitwise -- flags require bitwise operations */
import { ValidationError } from '../../errors'
import {
  AccountRootFlagsInterface,
  AccountRootFlags,
} from '../ledger/AccountRoot'
import { AccountSetTfFlags } from '../transactions/accountSet'
import { AMMDepositFlags } from '../transactions/AMMDeposit'
import { AMMWithdrawFlags } from '../transactions/AMMWithdraw'
import { NFTokenCreateOfferFlags } from '../transactions/NFTokenCreateOffer'
import { NFTokenMintFlags } from '../transactions/NFTokenMint'
import { OfferCreateFlags } from '../transactions/offerCreate'
import { PaymentFlags } from '../transactions/payment'
import { PaymentChannelClaimFlags } from '../transactions/paymentChannelClaim'
import type { Transaction } from '../transactions/transaction'
import { TrustSetFlags } from '../transactions/trustSet'
import { XChainModifyBridgeFlags } from '../transactions/XChainModifyBridge'

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

const txToFlag = {
  AccountSet: AccountSetTfFlags,
  AMMDeposit: AMMDepositFlags,
  AMMWithdraw: AMMWithdrawFlags,
  NFTokenCreateOffer: NFTokenCreateOfferFlags,
  NFTokenMint: NFTokenMintFlags,
  OfferCreate: OfferCreateFlags,
  PaymentChannelClaim: PaymentChannelClaimFlags,
  Payment: PaymentFlags,
  TrustSet: TrustSetFlags,
  XChainModifyBridge: XChainModifyBridgeFlags,
}

function istxToFlagKey(
  transactionType: string,
): transactionType is keyof typeof txToFlag {
  return transactionType in txToFlag
}

/**
 * Sets a transaction's flags to its numeric representation.
 *
 * @deprecated
 * This utility function is deprecated.
 * Use convertTxFlagsToNumber() instead and use the returned value to modify the tx.Flags from the caller.
 *
 * @param tx - A transaction to set its flags to its numeric representation.
 */
export function setTransactionFlagsToNumber(tx: Transaction): void {
  // eslint-disable-next-line no-console -- intended deprecation warning
  console.warn(
    'This function is deprecated. Use convertTxFlagsToNumber() instead and use the returned value to modify the tx.Flags from the caller.',
  )

  if (tx.Flags) {
    // eslint-disable-next-line no-param-reassign -- intended param reassign in setter, retain old functionality for compatibility
    tx.Flags = convertTxFlagsToNumber(tx)
  }
}

/**
 * Returns a transaction's flags as its numeric representation.
 *
 * @param tx - A transaction to parse flags for
 * @returns A numerical representation of a transaction's flags
 */
export function convertTxFlagsToNumber(tx: Transaction): number {
  if (typeof tx.Flags === 'number') {
    return tx.Flags
  }

  if (istxToFlagKey(tx.TransactionType)) {
    const flagEnum = txToFlag[tx.TransactionType]
    if (tx.Flags) {
      return Object.keys(tx.Flags).reduce((resultFlags, flag) => {
        if (flagEnum[flag] == null) {
          throw new ValidationError(
            `flag ${flag} doesn't exist in flagEnum: ${JSON.stringify(
              flagEnum,
            )}`,
          )
        }

        return tx.Flags?.[flag] ? resultFlags | flagEnum[flag] : resultFlags
      }, 0)
    }
  }

  return 0
}

/**
 * Convert a Transaction flags property into a map for easy interpretation.
 *
 * @param tx - A transaction to parse flags for.
 * @returns A map with all flags as booleans.
 */
export function parseTransactionFlags(tx: Transaction): object {
  const flags = convertTxFlagsToNumber(tx)
  if (flags === 0) {
    return {}
  }

  const booleanFlagMap = {}

  if (istxToFlagKey(tx.TransactionType)) {
    const transactionTypeFlags = txToFlag[tx.TransactionType]
    Object.values(transactionTypeFlags).forEach((flag) => {
      if (
        typeof flag === 'string' &&
        isFlagEnabled(flags, transactionTypeFlags[flag])
      ) {
        booleanFlagMap[flag] = true
      }
    })
  }

  return booleanFlagMap
}
