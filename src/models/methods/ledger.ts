import { LedgerIndex } from "../common";
import { LedgerEntry } from "../ledger";
import { BaseRequest, BaseResponse } from "./baseMethod";

export interface LedgerRequest extends BaseRequest {
    command: "ledger"
    ledger_hash?: string,
    ledger_index?: LedgerIndex
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
    accountState?: LedgerEntry[]
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
    transactions?: any[] // TODO: Retype this once we have transaction types
}

interface LedgerQueueData {
    account: string
    tx: any // TODO: Retype this once we have transaction types (Also include tx_blob as possible type: https://xrpl.org/ledger.html)
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
        ledger_index: LedgerIndex
        queue_data?: (LedgerQueueData | string)[]
        owner_funds?: string
    } & Ledger
}