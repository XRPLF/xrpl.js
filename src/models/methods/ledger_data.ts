import { AccountRoot, Amendments, Check, DepositPreauth, DirectoryNode, Escrow, FeeSettings, LedgerHashes, NegativeUNL, Offer, PayChannel, RippleState, SignerList, Ticket } from "../ledger";
import { BaseRequest, BaseResponse } from "./base_method";

export interface LedgerDataRequest extends BaseRequest {
    command: "ledger_data"
    ledger_hash?: string
    ledger_index?: string | number
    binary?: boolean
    limit?: number
    marker?: any
}

interface LedgerDataAdditionalFields {
    data?: string
    ledgerEntryType?: string
    index: string
}

export interface LedgerDataResponse extends BaseResponse {
    result: {
        ledger_index: number
        ledger_hash: string
        state: (LedgerDataAdditionalFields &  
            (AccountRoot | Amendments | Check | DepositPreauth | DirectoryNode
            | Escrow | FeeSettings | LedgerHashes | NegativeUNL | Offer
            | PayChannel | RippleState | SignerList | Ticket))[]
        marker?: any
    }
}