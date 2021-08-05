import { LedgerEntry } from "../ledger";
import { BaseRequest, BaseResponse } from "./baseMethod";

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
        state: (LedgerDataAdditionalFields & LedgerEntry)[]
        marker?: any
    }
}