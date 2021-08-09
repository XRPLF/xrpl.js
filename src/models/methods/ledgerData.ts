import { LedgerIndex } from "../common";
import { LedgerEntry } from "../ledger";
import { BaseRequest, BaseResponse } from "./baseMethod";

export interface LedgerDataRequest extends BaseRequest {
    command: "ledger_data"
    ledger_hash?: string
    ledger_index?: LedgerIndex
    binary?: boolean
    limit?: number
    marker?: any
}

type LabeledLedgerEntry = ({ledgerEntryType: string} & LedgerEntry)

type BinaryLedgerEntry = {data: string}

type State = {index: string} & (BinaryLedgerEntry | LabeledLedgerEntry)

export interface LedgerDataResponse extends BaseResponse {
    result: {
        ledger_index: number
        ledger_hash: string
        state: State[]
        marker?: any
    }
}