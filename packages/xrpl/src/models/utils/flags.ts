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
import { EnableAmendmentFlags } from '../transactions/enableAmendment'
import { LoanManageFlags } from '../transactions/loanManage'
import { LoanPayFlags } from '../transactions/loanPay'
import { LoanSetFlags } from '../transactions/loanSet'
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
  EnableAmendment: EnableAmendmentFlags,
  LoanManage: LoanManageFlags,
  LoanPay: LoanPayFlags,
  LoanSet: LoanSetFlags,
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
        ? resultFlags | (flagEnum[flag] ?? GlobalFlags[flag])
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
 * Options for {@link parseTransactionFlags}.
 */
export interface ParseTransactionFlagsOptions {
  /** Set to `true` to include disabled flags (as `false`) in the result. */
  includeAll?: boolean
}

/**
 * Convert a Transaction flags property into a map for easy interpretation.
 *
 * Can be called with a Transaction object or with a transaction type string
 * and numeric flags value directly (useful when working with raw API responses).
 *
 * By default, only enabled (true) flags are included in the result.
 * Pass `includeAll: true` in options to include all possible flags for the
 * transaction type with their boolean values.
 *
 * @example
 * ```typescript
 * // With a Transaction object (existing behavior)
 * parseTransactionFlags(tx)
 * // => { tfSell: true }
 *
 * // With transaction type and numeric flags
 * parseTransactionFlags('OfferCreate', 0x00080000)
 * // => { tfSell: true }
 *
 * // Include all possible flags for the transaction type
 * parseTransactionFlags('Payment', 0x00020000, { includeAll: true })
 * // => { tfNoRippleDirect: false, tfPartialPayment: true, tfLimitQuality: false }
 * ```
 *
 * @param txOrType - A transaction to parse flags for, or a transaction type string.
 * @param flagsNum - The numeric flags value (required when txOrType is a string).
 * @param options - Optional settings.
 * @param options.includeAll - Set to `true` to include disabled flags.
 * @returns A map of flag names to booleans.
 */
export function parseTransactionFlags(
  tx: Transaction,
  options?: ParseTransactionFlagsOptions,
): Record<string, boolean>
export function parseTransactionFlags(
  txType: string,
  flagsNum: number,
  options?: ParseTransactionFlagsOptions,
): Record<string, boolean>
export function parseTransactionFlags(
  txOrType: Transaction | string,
  flagsNumOrOptions?: number | ParseTransactionFlagsOptions,
  maybeOptions?: ParseTransactionFlagsOptions,
): Record<string, boolean> {
  let flags: number
  let transactionType: string
  let options: ParseTransactionFlagsOptions | undefined

  if (typeof txOrType === 'string') {
    transactionType = txOrType
    flags = (flagsNumOrOptions as number) ?? 0
    options = maybeOptions
  } else {
    transactionType = txOrType.TransactionType
    flags = convertTxFlagsToNumber(txOrType)
    options = flagsNumOrOptions as ParseTransactionFlagsOptions | undefined
  }

  const includeAll = options?.includeAll ?? false

  const booleanFlagMap: Record<string, boolean> = {}

  if (isTxToFlagKey(transactionType)) {
    const transactionTypeFlags = txToFlag[transactionType]
    Object.values(transactionTypeFlags).forEach((flag) => {
      if (typeof flag === 'string') {
        const enabled = isFlagEnabled(flags, transactionTypeFlags[flag])
        if (enabled || includeAll) {
          booleanFlagMap[flag] = enabled
        }
      }
    })
  }

  Object.values(GlobalFlags).forEach((flag) => {
    if (typeof flag === 'string') {
      const enabled = isFlagEnabled(flags, GlobalFlags[flag])
      if (enabled || includeAll) {
        booleanFlagMap[flag] = enabled
      }
    }
  })

  return booleanFlagMap
}
