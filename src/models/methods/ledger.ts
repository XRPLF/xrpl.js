import { QueueData } from './account_info';
import { BaseRequest, BaseResponse } from './base_method'

interface Ledger {
    account_hash: string
    accountState?: any[] // TODO: This says an array, but not what it's an array of! https://xrpl.org/ledger.html
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
    transactions: (string | JSON)[] //https://xrpl.org/ledger.html
}

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


export interface LedgerResponse extends BaseResponse {
    result: Ledger
    ledger_hash: string
    ledger_index: string | number
    queue_data?: QueueData[]
    owner_funds?: string
}