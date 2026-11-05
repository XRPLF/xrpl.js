/* eslint-disable max-lines -- need to work with a lot of transactions in a switch statement */
/* eslint-disable max-lines-per-function -- need to work with a lot of Tx verifications */

import { ValidationError } from '../../errors'
import { convertTxFlagsToNumber } from '../utils/flags'

import { AccountDelete, validateAccountDelete } from './accountDelete'
import { AccountSet, validateAccountSet } from './accountSet'
import { AMMBid, validateAMMBid } from './AMMBid'
import { AMMClawback, validateAMMClawback } from './AMMClawback'
import { AMMCreate, validateAMMCreate } from './AMMCreate'
import { AMMDelete, validateAMMDelete } from './AMMDelete'
import { AMMDeposit, validateAMMDeposit } from './AMMDeposit'
import { AMMVote, validateAMMVote } from './AMMVote'
import { AMMWithdraw, validateAMMWithdraw } from './AMMWithdraw'
import { BallotCastVote, validateBallotCastVote } from './ballotCastVote'
import { BallotCreate, validateBallotCreate } from './ballotCreate'
import { BallotDelete, validateBallotDelete } from './ballotDelete'
import { BallotFinalize, validateBallotFinalize } from './ballotFinalize'
import { Batch, validateBatch } from './batch'
import { BeneficiarySet, validateBeneficiarySet } from './beneficiarySet'
import { CheckCancel, validateCheckCancel } from './checkCancel'
import { CheckCash, validateCheckCash } from './checkCash'
import { CheckCreate, validateCheckCreate } from './checkCreate'
import { Clawback, validateClawback } from './clawback'
import {
  BaseTransaction,
  isIssuedCurrencyAmount,
  isRecord,
  validateBaseTransaction,
} from './common'
import {
  ConfidentialMPTClawback,
  validateConfidentialMPTClawback,
} from './ConfidentialMPTClawback'
import {
  ConfidentialMPTConvert,
  validateConfidentialMPTConvert,
} from './ConfidentialMPTConvert'
import {
  ConfidentialMPTConvertBack,
  validateConfidentialMPTConvertBack,
} from './ConfidentialMPTConvertBack'
import {
  ConfidentialMPTHolderKeyUpdate,
  validateConfidentialMPTHolderKeyUpdate,
} from './confidentialMPTHolderKeyUpdate'
import {
  ConfidentialMPTMergeInbox,
  validateConfidentialMPTMergeInbox,
} from './ConfidentialMPTMergeInbox'
import {
  ConfidentialMPTMirrorUpdate,
  validateConfidentialMPTMirrorUpdate,
} from './confidentialMPTMirrorUpdate'
import {
  ConfidentialMPTSend,
  validateConfidentialMPTSend,
} from './ConfidentialMPTSend'
import { CouponClaim, validateCouponClaim } from './couponClaim'
import { CouponPay, validateCouponPay } from './couponPay'
import {
  CouponScheduleCreate,
  validateCouponScheduleCreate,
} from './couponScheduleCreate'
import {
  CouponScheduleDelete,
  validateCouponScheduleDelete,
} from './couponScheduleDelete'
import {
  CouponScheduleSet,
  validateCouponScheduleSet,
} from './couponScheduleSet'
import { CredentialAccept, validateCredentialAccept } from './CredentialAccept'
import { CredentialCreate, validateCredentialCreate } from './CredentialCreate'
import { CredentialDelete, validateCredentialDelete } from './CredentialDelete'
import { DelegateSet, validateDelegateSet } from './delegateSet'
import { DepositPreauth, validateDepositPreauth } from './depositPreauth'
import { DIDDelete, validateDIDDelete } from './DIDDelete'
import { DIDSet, validateDIDSet } from './DIDSet'
import { EnableAmendment } from './enableAmendment'
import { EscrowCancel, validateEscrowCancel } from './escrowCancel'
import { EscrowCreate, validateEscrowCreate } from './escrowCreate'
import { EscrowFinish, validateEscrowFinish } from './escrowFinish'
import { FirewallDelete, validateFirewallDelete } from './firewallDelete'
import { FirewallSet, validateFirewallSet } from './firewallSet'
import {
  LoanBrokerCoverClawback,
  validateLoanBrokerCoverClawback,
} from './loanBrokerCoverClawback'
import {
  LoanBrokerCoverDeposit,
  validateLoanBrokerCoverDeposit,
} from './loanBrokerCoverDeposit'
import {
  LoanBrokerCoverWithdraw,
  validateLoanBrokerCoverWithdraw,
} from './loanBrokerCoverWithdraw'
import { LoanBrokerDelete, validateLoanBrokerDelete } from './loanBrokerDelete'
import { LoanBrokerSet, validateLoanBrokerSet } from './loanBrokerSet'
import { LoanDelete, validateLoanDelete } from './loanDelete'
import { LoanManage, validateLoanManage } from './loanManage'
import { LoanPay, validateLoanPay } from './loanPay'
import { LoanSet, validateLoanSet } from './loanSet'
import { TransactionMetadata } from './metadata'
import { MPTokenAuthorize, validateMPTokenAuthorize } from './MPTokenAuthorize'
import {
  MPTokenIssuanceCreate,
  validateMPTokenIssuanceCreate,
} from './MPTokenIssuanceCreate'
import {
  MPTokenIssuanceDestroy,
  validateMPTokenIssuanceDestroy,
} from './MPTokenIssuanceDestroy'
import {
  MPTokenIssuanceSet,
  validateMPTokenIssuanceSet,
} from './MPTokenIssuanceSet'
import {
  NFTokenAcceptOffer,
  validateNFTokenAcceptOffer,
} from './NFTokenAcceptOffer'
import { NFTokenBurn, validateNFTokenBurn } from './NFTokenBurn'
import {
  NFTokenCancelOffer,
  validateNFTokenCancelOffer,
} from './NFTokenCancelOffer'
import {
  NFTokenCreateOffer,
  validateNFTokenCreateOffer,
} from './NFTokenCreateOffer'
import { NFTokenMint, validateNFTokenMint } from './NFTokenMint'
import { NFTokenModify, validateNFTokenModify } from './NFTokenModify'
import { OfferCancel, validateOfferCancel } from './offerCancel'
import { OfferCreate, validateOfferCreate } from './offerCreate'
import { OracleDelete, validateOracleDelete } from './oracleDelete'
import { OracleSet, validateOracleSet } from './oracleSet'
import { PasskeyListSet, validatePasskeyListSet } from './passkeyListSet'
import { Payment, validatePayment } from './payment'
import {
  PaymentChannelClaim,
  validatePaymentChannelClaim,
} from './paymentChannelClaim'
import {
  PaymentChannelClawback,
  validatePaymentChannelClawback,
} from './paymentChannelClawback'
import {
  PaymentChannelCreate,
  validatePaymentChannelCreate,
} from './paymentChannelCreate'
import {
  PaymentChannelFund,
  validatePaymentChannelFund,
} from './paymentChannelFund'
import {
  PermissionedDomainDelete,
  validatePermissionedDomainDelete,
} from './permissionedDomainDelete'
import {
  PermissionedDomainSet,
  validatePermissionedDomainSet,
} from './permissionedDomainSet'
import { RepoAccept, validateRepoAccept } from './repoAccept'
import { RepoCancel, validateRepoCancel } from './repoCancel'
import { RepoClose, validateRepoClose } from './repoClose'
import { RepoCreate, validateRepoCreate } from './repoCreate'
import { RepoDefault, validateRepoDefault } from './repoDefault'
import { SetFee } from './setFee'
import { SetRegularKey, validateSetRegularKey } from './setRegularKey'
import { SignerListSet, validateSignerListSet } from './signerListSet'
import { SponsorshipSet, validateSponsorshipSet } from './sponsorshipSet'
import {
  SponsorshipTransfer,
  validateSponsorshipTransfer,
} from './sponsorshipTransfer'
import {
  SubscriptionCancel,
  validateSubscriptionCancel,
} from './subscriptionCancel'
import {
  SubscriptionClaim,
  validateSubscriptionClaim,
} from './subscriptionClaim'
import { SubscriptionSet, validateSubscriptionSet } from './subscriptionSet'
import { TicketCreate, validateTicketCreate } from './ticketCreate'
import { TokenConvert, validateTokenConvert } from './tokenConvert'
import {
  TokenIssuanceCreate,
  validateTokenIssuanceCreate,
} from './tokenIssuanceCreate'
import {
  TokenIssuanceDestroy,
  validateTokenIssuanceDestroy,
} from './tokenIssuanceDestroy'
import { TokenIssuanceSet, validateTokenIssuanceSet } from './tokenIssuanceSet'
import {
  TransactionProposalCancel,
  validateTransactionProposalCancel,
} from './transactionProposalCancel'
import {
  TransactionProposalCreate,
  validateTransactionProposalCreate,
} from './transactionProposalCreate'
import { TrustSet, validateTrustSet } from './trustSet'
import { UNLModify } from './UNLModify'
import { VaultClawback, validateVaultClawback } from './vaultClawback'
import { VaultCreate, validateVaultCreate } from './vaultCreate'
import { VaultDelete, validateVaultDelete } from './vaultDelete'
import { VaultDeposit, validateVaultDeposit } from './vaultDeposit'
import { VaultSet, validateVaultSet } from './vaultSet'
import { VaultWithdraw, validateVaultWithdraw } from './vaultWithdraw'
import { WithdrawPreauth, validateWithdrawPreauth } from './withdrawPreauth'

/**
 * Transactions that can be submitted by clients
 *
 * @category Transaction Models
 */
export type SubmittableTransaction =
  | AMMBid
  | AMMClawback
  | AMMCreate
  | AMMDelete
  | AMMDeposit
  | AMMVote
  | AMMWithdraw
  | AccountDelete
  | AccountSet
  | BallotCastVote
  | BallotCreate
  | BallotDelete
  | BallotFinalize
  | Batch
  | BeneficiarySet
  | CheckCancel
  | CheckCash
  | CheckCreate
  | Clawback
  | ConfidentialMPTClawback
  | ConfidentialMPTConvert
  | ConfidentialMPTConvertBack
  | ConfidentialMPTHolderKeyUpdate
  | ConfidentialMPTMergeInbox
  | ConfidentialMPTMirrorUpdate
  | ConfidentialMPTSend
  | CouponClaim
  | CouponPay
  | CouponScheduleCreate
  | CouponScheduleDelete
  | CouponScheduleSet
  | CredentialAccept
  | CredentialCreate
  | CredentialDelete
  | DIDDelete
  | DIDSet
  | DelegateSet
  | DepositPreauth
  | EscrowCancel
  | EscrowCreate
  | EscrowFinish
  | FirewallDelete
  | FirewallSet
  | LoanBrokerSet
  | LoanBrokerCoverClawback
  | LoanBrokerCoverDeposit
  | LoanBrokerCoverWithdraw
  | LoanBrokerDelete
  | LoanSet
  | LoanDelete
  | LoanManage
  | LoanPay
  | MPTokenAuthorize
  | MPTokenIssuanceCreate
  | MPTokenIssuanceDestroy
  | MPTokenIssuanceSet
  | NFTokenAcceptOffer
  | NFTokenBurn
  | NFTokenCancelOffer
  | NFTokenCreateOffer
  | NFTokenMint
  | NFTokenModify
  | OfferCancel
  | OfferCreate
  | OracleDelete
  | OracleSet
  | PasskeyListSet
  | Payment
  | PaymentChannelClaim
  | PaymentChannelClawback
  | PaymentChannelCreate
  | PaymentChannelFund
  | PermissionedDomainSet
  | PermissionedDomainDelete
  | RepoAccept
  | RepoCancel
  | RepoClose
  | RepoCreate
  | RepoDefault
  | SetRegularKey
  | SignerListSet
  | SponsorshipSet
  | SponsorshipTransfer
  | SubscriptionCancel
  | SubscriptionClaim
  | SubscriptionSet
  | TicketCreate
  | TokenConvert
  | TokenIssuanceCreate
  | TokenIssuanceDestroy
  | TokenIssuanceSet
  | TransactionProposalCancel
  | TransactionProposalCreate
  | TrustSet
  | VaultClawback
  | VaultCreate
  | VaultDelete
  | VaultDeposit
  | VaultSet
  | VaultWithdraw
  | WithdrawPreauth

/**
 * Transactions that can only be created by validators.
 *
 * @category Transaction Models
 */
export type PseudoTransaction = EnableAmendment | SetFee | UNLModify

/**
 * All transactions that can live on the XRPL
 *
 * @category Transaction Models
 */
export type Transaction = SubmittableTransaction | PseudoTransaction

/**
 * @category Transaction Models
 */
export interface TransactionAndMetadata<
  T extends BaseTransaction = Transaction,
> {
  transaction: T
  metadata: TransactionMetadata<T>
}

/**
 * Verifies various Transaction Types.
 * Encode/decode and individual type validation.
 *
 * @param transaction - A Transaction.
 * @throws ValidationError When the Transaction is malformed.
 * @category Utilities
 */
export function validate(transaction: Record<string, unknown>): void {
  const tx = { ...transaction }

  // should already be done in the tx-specific validation, but doesn't hurt to check again
  validateBaseTransaction(tx)

  Object.keys(tx).forEach((key) => {
    const standard_currency_code_len = 3
    const value = tx[key]
    if (value && isIssuedCurrencyAmount(value)) {
      const txCurrency = value.currency

      if (
        txCurrency.length === standard_currency_code_len &&
        txCurrency.toUpperCase() === 'XRP'
      ) {
        throw new ValidationError(
          `Cannot have an issued currency with a similar standard code to XRP (received '${txCurrency}'). XRP is not an issued currency.`,
        )
      }
    }
  })

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- okay here
  tx.Flags = convertTxFlagsToNumber(tx as unknown as Transaction)
  switch (tx.TransactionType) {
    case 'AMMBid':
      validateAMMBid(tx)
      break

    case 'AMMClawback':
      validateAMMClawback(tx)
      break

    case 'AMMCreate':
      validateAMMCreate(tx)
      break

    case 'AMMDelete':
      validateAMMDelete(tx)
      break

    case 'AMMDeposit':
      validateAMMDeposit(tx)
      break

    case 'AMMVote':
      validateAMMVote(tx)
      break

    case 'AMMWithdraw':
      validateAMMWithdraw(tx)
      break

    case 'AccountDelete':
      validateAccountDelete(tx)
      break

    case 'AccountSet':
      validateAccountSet(tx)
      break

    case 'BallotCastVote':
      validateBallotCastVote(tx)
      break

    case 'BallotCreate':
      validateBallotCreate(tx)
      break

    case 'BallotDelete':
      validateBallotDelete(tx)
      break

    case 'BallotFinalize':
      validateBallotFinalize(tx)
      break

    case 'Batch':
      validateBatch(tx)
      // This is done here to avoid issues with dependency cycles

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- okay here
      // @ts-expect-error -- already checked
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- already checked above
      tx.RawTransactions.forEach((innerTx: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- already checked above
        validate(innerTx.RawTransaction as Record<string, unknown>)
      })
      break

    case 'BeneficiarySet':
      validateBeneficiarySet(tx)
      break

    case 'CheckCancel':
      validateCheckCancel(tx)
      break

    case 'CheckCash':
      validateCheckCash(tx)
      break

    case 'CheckCreate':
      validateCheckCreate(tx)
      break

    case 'Clawback':
      validateClawback(tx)
      break

    case 'ConfidentialMPTClawback':
      validateConfidentialMPTClawback(tx)
      break

    case 'ConfidentialMPTConvert':
      validateConfidentialMPTConvert(tx)
      break

    case 'ConfidentialMPTConvertBack':
      validateConfidentialMPTConvertBack(tx)
      break

    case 'ConfidentialMPTHolderKeyUpdate':
      validateConfidentialMPTHolderKeyUpdate(tx)
      break

    case 'ConfidentialMPTMergeInbox':
      validateConfidentialMPTMergeInbox(tx)
      break

    case 'ConfidentialMPTMirrorUpdate':
      validateConfidentialMPTMirrorUpdate(tx)
      break

    case 'ConfidentialMPTSend':
      validateConfidentialMPTSend(tx)
      break

    case 'CouponClaim':
      validateCouponClaim(tx)
      break

    case 'CouponPay':
      validateCouponPay(tx)
      break

    case 'CouponScheduleCreate':
      validateCouponScheduleCreate(tx)
      break

    case 'CouponScheduleDelete':
      validateCouponScheduleDelete(tx)
      break

    case 'CouponScheduleSet':
      validateCouponScheduleSet(tx)
      break

    case 'CredentialAccept':
      validateCredentialAccept(tx)
      break

    case 'CredentialCreate':
      validateCredentialCreate(tx)
      break

    case 'CredentialDelete':
      validateCredentialDelete(tx)
      break

    case 'DIDDelete':
      validateDIDDelete(tx)
      break

    case 'DIDSet':
      validateDIDSet(tx)
      break

    case 'DelegateSet':
      validateDelegateSet(tx)
      break

    case 'DepositPreauth':
      validateDepositPreauth(tx)
      break

    case 'EscrowCancel':
      validateEscrowCancel(tx)
      break

    case 'EscrowCreate':
      validateEscrowCreate(tx)
      break

    case 'EscrowFinish':
      validateEscrowFinish(tx)
      break

    case 'FirewallDelete':
      validateFirewallDelete(tx)
      break

    case 'FirewallSet':
      validateFirewallSet(tx)
      break

    case 'LoanBrokerCoverClawback':
      validateLoanBrokerCoverClawback(tx)
      break

    case 'LoanBrokerCoverDeposit':
      validateLoanBrokerCoverDeposit(tx)
      break

    case 'LoanBrokerCoverWithdraw':
      validateLoanBrokerCoverWithdraw(tx)
      break

    case 'LoanBrokerDelete':
      validateLoanBrokerDelete(tx)
      break

    case 'LoanBrokerSet':
      validateLoanBrokerSet(tx)
      break

    case 'LoanSet':
      validateLoanSet(tx)
      break

    case 'LoanManage':
      validateLoanManage(tx)
      break

    case 'LoanDelete':
      validateLoanDelete(tx)
      break

    case 'LoanPay':
      validateLoanPay(tx)
      break

    case 'MPTokenAuthorize':
      validateMPTokenAuthorize(tx)
      break

    case 'MPTokenIssuanceCreate':
      validateMPTokenIssuanceCreate(tx)
      break

    case 'MPTokenIssuanceDestroy':
      validateMPTokenIssuanceDestroy(tx)
      break

    case 'MPTokenIssuanceSet':
      validateMPTokenIssuanceSet(tx)
      break

    case 'NFTokenAcceptOffer':
      validateNFTokenAcceptOffer(tx)
      break

    case 'NFTokenBurn':
      validateNFTokenBurn(tx)
      break

    case 'NFTokenCancelOffer':
      validateNFTokenCancelOffer(tx)
      break

    case 'NFTokenCreateOffer':
      validateNFTokenCreateOffer(tx)
      break

    case 'NFTokenMint':
      validateNFTokenMint(tx)
      break

    case 'NFTokenModify':
      validateNFTokenModify(tx)
      break

    case 'OfferCancel':
      validateOfferCancel(tx)
      break

    case 'OfferCreate':
      validateOfferCreate(tx)
      break

    case 'OracleDelete':
      validateOracleDelete(tx)
      break

    case 'OracleSet':
      validateOracleSet(tx)
      break

    case 'PasskeyListSet':
      validatePasskeyListSet(tx)
      break

    case 'Payment':
      validatePayment(tx)
      break

    case 'PaymentChannelClaim':
      validatePaymentChannelClaim(tx)
      break

    case 'PaymentChannelClawback':
      validatePaymentChannelClawback(tx)
      break

    case 'PaymentChannelCreate':
      validatePaymentChannelCreate(tx)
      break

    case 'PaymentChannelFund':
      validatePaymentChannelFund(tx)
      break

    case 'PermissionedDomainSet':
      validatePermissionedDomainSet(tx)
      break

    case 'PermissionedDomainDelete':
      validatePermissionedDomainDelete(tx)
      break

    case 'RepoAccept':
      validateRepoAccept(tx)
      break

    case 'RepoCancel':
      validateRepoCancel(tx)
      break

    case 'RepoClose':
      validateRepoClose(tx)
      break

    case 'RepoCreate':
      validateRepoCreate(tx)
      break

    case 'RepoDefault':
      validateRepoDefault(tx)
      break

    case 'SetRegularKey':
      validateSetRegularKey(tx)
      break

    case 'SignerListSet':
      validateSignerListSet(tx)
      break

    case 'SponsorshipSet':
      validateSponsorshipSet(tx)
      break

    case 'SponsorshipTransfer':
      validateSponsorshipTransfer(tx)
      break

    case 'SubscriptionCancel':
      validateSubscriptionCancel(tx)
      break

    case 'SubscriptionClaim':
      validateSubscriptionClaim(tx)
      break

    case 'SubscriptionSet':
      validateSubscriptionSet(tx)
      break

    case 'TicketCreate':
      validateTicketCreate(tx)
      break

    case 'TokenConvert':
      validateTokenConvert(tx)
      break

    case 'TokenIssuanceCreate':
      validateTokenIssuanceCreate(tx)
      break

    case 'TokenIssuanceDestroy':
      validateTokenIssuanceDestroy(tx)
      break

    case 'TokenIssuanceSet':
      validateTokenIssuanceSet(tx)
      break

    case 'TransactionProposalCancel':
      validateTransactionProposalCancel(tx)
      break

    case 'TransactionProposalCreate':
      validateTransactionProposalCreate(tx)
      // The proposed transaction is validated here to avoid a dependency cycle
      if (isRecord(tx.ProposedTransaction)) {
        validate(tx.ProposedTransaction)
      }
      break

    case 'TrustSet':
      validateTrustSet(tx)
      break

    case 'VaultClawback':
      validateVaultClawback(tx)
      break

    case 'VaultCreate':
      validateVaultCreate(tx)
      break

    case 'VaultDelete':
      validateVaultDelete(tx)
      break

    case 'VaultDeposit':
      validateVaultDeposit(tx)
      break

    case 'VaultSet':
      validateVaultSet(tx)
      break

    case 'VaultWithdraw':
      validateVaultWithdraw(tx)
      break

    case 'WithdrawPreauth':
      validateWithdrawPreauth(tx)
      break

    default:
      throw new ValidationError(
        `Invalid field TransactionType: ${tx.TransactionType}`,
      )
  }
}
