import { LedgerIndex } from "../common";
import { Ledger } from "../ledger";
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

interface LedgerQueueData {
    account: string
    // TODO: Retype tx once we have transaction types 
    // Also include tx_blob as possible type: https://xrpl.org/ledger.html
    // Also handle the special case where 'owner_funds: string' is a field of OfferCreate sometimes - https://xrpl.org/ledger.html#response-format
    tx: any 
    retries_remaining: number
    preflight_result: string
    last_result?: string
    auth_change?: boolean
    fee?: string
    fee_level?: string
    max_spend_drops?: string
}

interface BinaryLedger extends Omit<Omit<Ledger, 'transactions'>, 'accountState'> {
    accountState?: string[]
    transactions?: string[]
}

export interface LedgerResponse extends BaseResponse {
    result: {
        ledger: Ledger | BinaryLedger
        ledger_hash: string
        ledger_index: number
        queue_data?: (LedgerQueueData | string)[]
        validated: boolean //TODO: Figure out if the example is correct, or the documentation for this field - https://xrpl.org/ledger.html#response-format
    }
}