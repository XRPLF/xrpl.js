import { BaseRequest, BaseResponse } from "./baseMethod";
import { LedgerEntry } from "../ledger";
import { LedgerIndex } from "../common";

export interface LedgerEntryRequest extends BaseRequest {
    command: "ledger_entry"
    binary?: boolean
    ledger_hash?: string
    ledger_index?: LedgerIndex

    // Only one of the following properties should be defined in a single request
    // https://xrpl.org/ledger_entry.html

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
    
    ticket?: {
        owner: string
        ticket_sequence: number
    } | string
}

export interface LedgerEntryResponse extends BaseResponse {
    result: {
        index: string
        ledger_index: number
        node?: LedgerEntry
        node_binary?: string
    }
}