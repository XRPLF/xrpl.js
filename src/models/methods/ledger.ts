import { AccountRoot, Amendments, Check, DepositPreauth, DirectoryNode, Escrow, FeeSettings, LedgerHashes, NegativeUNL, Offer, PayChannel, RippleState, SignerList, Ticket } from "../ledger";
import { QueueData } from './account_info';
import { BaseRequest, BaseResponse } from './base_method'
export interface LedgerRequest extends BaseRequest {
    command: "ledger"
    ledger_hash?: string,
    ledger_index?: string | number
    full?: boolean
    accounts?: boolean
    transactions?: boolean
    expand?: boolean
    owner_funds?: boolean
    binary?: boolean
    queue?: boolean
}

interface Ledger {
    account_hash: string
    accountState?: (AccountRoot | Amendments | Check | DepositPreauth | DirectoryNode
        | Escrow | FeeSettings | LedgerHashes | NegativeUNL | Offer
        | PayChannel | RippleState | SignerList | Ticket)[]
    close_flags: number
    close_time: number
    close_time_human: string
    close_time_resolution: number
    closed: boolean
    ledger_hash: string
    ledger_index: string
    parent_close_time: number
    parent_hash: string
    total_coins: string
    transaction_hash: string 
    transactions?: (string | JSON)[] //https://xrpl.org/ledger.html
}

interface LedgerQueueData {
    account: string
    tx: string | JSON | 
    {
        tx_blob: string
    }  
    retries_remaining: number
    preflight_result: string
    last_result?: string
    auth_change?: boolean
    fee?: string
    fee_level?: string
    max_spend_drops?: string
}

export interface LedgerResponse extends BaseResponse {
    result: {
        ledger_hash: string
        ledger_index: string | number
        queue_data?: (LedgerQueueData | string)[]
        owner_funds?: string
    } & Ledger
}