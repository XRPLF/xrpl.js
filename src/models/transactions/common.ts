import { ValidationError } from "../../common/errors"
import { Memo, Signer } from "../common"
import { onlyHasFields } from "../utils"

const transactionTypes = [
    "AccountSet",
    "AccountDelete",
    "CheckCancel",
    "CheckCash",
    "CheckCreate",
    "DepositPreauth",
    "EscrowCancel",
    "EscrowCreate",
    "EscrowFinish",
    "OfferCancel",
    "OfferCreate",
    "Payment",
    "PaymentChannelClaim",
    "PaymentChannelCreate",
    "PaymentChannelFund",
    "SetRegularKey",
    "SignerListSet",
    "TicketCreate",
    "TrustSet",
]

const isMemo = (obj: {Memo: Memo}): boolean => {
    const memo = obj.Memo
    const size = Object.keys(memo).length
    const validData = memo.MemoData === undefined 
        || typeof memo.MemoData === 'string'
    const validFormat = memo.MemoFormat === undefined 
        || typeof memo.MemoData === 'string'
    const validType = memo.MemoType === undefined
        || typeof memo.MemoType === 'string'

    return (1 <= size && size <= 3) 
        && validData 
        && validFormat 
        && validType
        && onlyHasFields(memo, ["MemoFormat", "MemoData", "MemoType"])
}

const isSigner = (signer: Signer): boolean => {
    return Object.keys(signer).length === 3
        && typeof signer.Account === 'string'
        && typeof signer.TxnSignature === 'string'
        && typeof signer.SigningPubKey === 'string'
}

export interface CommonFields {
  Account: string;
  TransactionType: string;
  Fee?: string;
  Sequence?: number;
  AccountTxnID?: string;
  Flags?: number;
  LastLedgerSequence?: number;
  Memos?: Array<{ Memo: Memo }>;
  Signers?: Array<Signer>;
  SourceTag?: number;
  SigningPubKey?: string;
  TicketSequence?: number;
  TxnSignature?: string;
}

/**
 * verify the common fields of a transaction. The verify functionality will be
 * optional, and will check transaction form at runtime. This should be called
 * any time a transaction will be verified.
 * 
 * @param common - An interface w/ common transaction fields
 * @returns - Void
 * @throws - When the common param is malformed. 
 */
export function verifyCommonFields(common: CommonFields): void {
    if (common.Account === undefined)
        throw new ValidationError("CommonFields: missing field Account")
    
    if (typeof common.Account !== 'string')
        throw new ValidationError("CommonFields: Account not string")

    if (common.TransactionType === undefined)
        throw new ValidationError("CommonFields: missing field TransactionType")

    if (typeof common.TransactionType !== 'string')
        throw new ValidationError("CommonFields: TransactionType not string")

    if (!transactionTypes.includes(common.TransactionType))
        throw new ValidationError("CommonFields: Unknown TransactionType")

    if (common.Fee !== undefined && typeof common.Fee !== 'string')
        throw new ValidationError("CommonFields: invalid Fee")

    if (common.Sequence !== undefined && typeof common.Sequence !== 'number')
        throw new ValidationError("CommonFields: invalid Sequence")

    if (common.Flags !== undefined && typeof common.Flags !== 'number')
        throw new ValidationError("CommonFields: invalid Flags")

    if (common.AccountTxnID !== undefined 
        && typeof common.AccountTxnID !== 'string')
        throw new ValidationError("CommonFields: invalid AccountTxnID")

    if (common.LastLedgerSequence !== undefined 
        && typeof common.LastLedgerSequence !== 'number')
        throw new ValidationError("CommonFields: invalid LastLedgerSequence")

    if (common.Memos !== undefined 
        && (common.Memos.length === 0 || !common.Memos.every(isMemo)))
        throw new ValidationError("CommonFields: invalid Memos")

    if (common.Signers !== undefined
        && (common.Signers.length === 0 || !common.Signers.every(isSigner)))
        throw new ValidationError("CommonFields: invalid Signers")

    if (common.SourceTag !== undefined && typeof common.SourceTag !== 'number')
        throw new ValidationError("CommonFields: invalid SourceTag")

    if (common.SigningPubKey !== undefined 
        && typeof common.SigningPubKey !== 'string')
        throw new ValidationError("CommonFields: invalid SigningPubKey")

    if (common.TicketSequence !== undefined 
        && typeof common.TicketSequence !== 'number')
        throw new ValidationError("CommonFields: invalid TicketSequence")

    if (common.TxnSignature !== undefined 
        && typeof common.TxnSignature !== 'string')
        throw new ValidationError("CommonFields: invalid TxnSignature")
}