import { AccountRoot, Amendments, Check, DepositPreauth, DirectoryNode, Escrow, FeeSettings, LedgerHashes, NegativeUNL, Offer, PayChannel, RippleState, SignerList, Ticket } from "../ledger";
import { BaseRequest, BaseResponse } from "./base_method";

export interface LedgerEntryRequest extends BaseRequest {
    binary?: boolean
    ledger_hash?: string
    ledger_index?: string | number
    index?: string
    account_root?: string
    
    directory?: {
       sub_index?: number
       dir_root?: string
       owner?: string 
    } | string
    
    offer?: {
        account: string
        seq: number
    } | string

    ripple_state?: {
        accounts: string[]
        currency: string
    }
    
    check?: string

    escrow?: {
        owner: string
        seq: number
    } | string

    payment_channel?: string

    deposit_preauth?: {
        owner: string
        authorized: string
    } | string
    
    ticket: {
        owner: string
        ticket_sequence: number
    } | string
}

export interface LedgerEntryResponse extends BaseResponse {
    index: string
    ledger_index: number
    node?: AccountRoot | Amendments | Check | DepositPreauth | DirectoryNode | Escrow
    | FeeSettings | LedgerHashes | NegativeUNL | Offer | PayChannel | RippleState | SignerList
    | Ticket
    node_binary?: string
}