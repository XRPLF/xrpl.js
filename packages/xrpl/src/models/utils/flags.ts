/* eslint-disable no-bitwise -- flags require bitwise operations */
import { ValidationError } from '../../errors'
import {
  AccountRootFlagsInterface,
  AccountRootFlags,
} from '../ledger/AccountRoot'
import { AccountSetTfFlags } from '../transactions/accountSet'
import { AMMClawbackFlags } from '../transactions/AMMClawback'
import { AMMDepositFlags } from '../transactions/AMMDeposit'
import { AMMWithdrawFlags } from '../transactions/AMMWithdraw'
import { BatchFlags } from '../transactions/batch'
import { GlobalFlags } from '../transactions/common'
import { MPTokenAuthorizeFlags } from '../transactions/MPTokenAuthorize'
import { MPTokenIssuanceCreateFlags } from '../transactions/MPTokenIssuanceCreate'
import { MPTokenIssuanceSetFlags } from '../transactions/MPTokenIssuanceSet'
import { NFTokenCreateOfferFlags } from '../transactions/NFTokenCreateOffer'
import { NFTokenMintFlags } from '../transactions/NFTokenMint'
import { OfferCreateFlags } from '../transactions/offerCreate'
import { PaymentFlags } from '../transactions/payment'
import { PaymentChannelClaimFlags } from '../transactions/paymentChannelClaim'
import type { Transaction } from '../transactions/transaction'
import { TrustSetFlags } from '../transactions/trustSet'
import { VaultCreateFlags } from '../transactions/vaultCreate'
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
  AMMClawback: AMMClawbackFlags,
  AMMDeposit: AMMDepositFlags,
  AMMWithdraw: AMMWithdrawFlags,
  Batch: BatchFlags,
  MPTokenAuthorize: MPTokenAuthorizeFlags,
  MPTokenIssuanceCreate: MPTokenIssuanceCreateFlags,
  MPTokenIssuanceSet: MPTokenIssuanceSetFlags,
  NFTokenCreateOffer: NFTokenCreateOfferFlags,
  NFTokenMint: NFTokenMintFlags,
  OfferCreate: OfferCreateFlags,
  PaymentChannelClaim: PaymentChannelClaimFlags,
  Payment: PaymentFlags,
  TrustSet: TrustSetFlags,
  VaultCreate: VaultCreateFlags,
  XChainModifyBridge: XChainModifyBridgeFlags,
}

function isTxToFlagKey(
  transactionType: string,
): transactionType is keyof typeof txToFlag {
  return transactionType in txToFlag
}

/**
 * Sets a transaction's flags to its numeric representation.
 *
 * @deprecated
 * This utility function is deprecated.
 * Use convertTxFlagsToNumber() instead and use the returned value to modify the Transaction.Flags from the caller.
 *
 * @param tx - A transaction to set its flags to its numeric representation.
 */
export function setTransactionFlagsToNumber(tx: Transaction): void {
  // eslint-disable-next-line no-console -- intended deprecation warning
  console.warn(
    'This function is deprecated. Use convertTxFlagsToNumber() instead and use the returned value to modify the Transaction.Flags from the caller.',
  )

  if (tx.Flags) {
    // eslint-disable-next-line no-param-reassign -- intended param reassign in setter, retain old functionality for compatibility
    tx.Flags = convertTxFlagsToNumber(tx)
  }
}

/**
 * Returns a Transaction's Flags as its numeric representation.
 *
 * @param tx - A Transaction to parse Flags for
 * @returns A numerical representation of a Transaction's Flags
 */
export function convertTxFlagsToNumber(tx: Transaction): number {
  const txFlags = tx.Flags
  if (txFlags == null) {
    return 0
  }
  if (typeof txFlags === 'number') {
    return txFlags
  }

  if (isTxToFlagKey(tx.TransactionType)) {
    const flagEnum = txToFlag[tx.TransactionType]
    return Object.keys(txFlags).reduce((resultFlags, flag) => {
      if (flagEnum[flag] == null && GlobalFlags[flag] == null) {
        throw new ValidationError(`Invalid flag ${flag}.`)
      }

      return txFlags[flag]
        ? resultFlags | (flagEnum[flag] || GlobalFlags[flag])
        : resultFlags
    }, 0)
  }

  return Object.keys(txFlags).reduce((resultFlags, flag) => {
    if (GlobalFlags[flag] == null) {
      throw new ValidationError(
        `Invalid flag ${flag}. Valid flags are ${JSON.stringify(GlobalFlags)}`,
      )
    }

    return txFlags[flag] ? resultFlags | GlobalFlags[flag] : resultFlags
  }, 0)
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

  if (isTxToFlagKey(tx.TransactionType)) {
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

  Object.values(GlobalFlags).forEach((flag) => {
    if (typeof flag === 'string' && isFlagEnabled(flags, GlobalFlags[flag])) {
      booleanFlagMap[flag] = true
    }
  })

  return booleanFlagMap
}
