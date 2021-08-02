import { AccountRoot, Amendments, Check, DepositPreauth, DirectoryNode, Escrow, FeeSettings, LedgerHashes, NegativeUNL, Offer, PayChannel, RippleState, SignerList, Ticket } from "../ledger";
import { BaseRequest, BaseResponse } from "./base_method";

export interface LedgerDataRequest extends BaseRequest {
    //TODO: id is labeled as Arbitrary in this doc, should we update it to match? - https://xrpl.org/ledger_data.html
    ledger_hash?: string
    ledger_index?: string | number
    binary?: boolean
    limit?: number
    marker: any //The format for 'Marker' is intentionally undefined - https://xrpl.org/markers-and-pagination.html
}

interface BinaryLedgerState {
    data: string
    index: string
}

export interface LedgerDataResponse extends BaseResponse {
    ledger_index: number
    ledger_hash: string
    state: (BinaryLedgerState //Encoded version of below options
        | AccountRoot | Amendments | Check | DepositPreauth | DirectoryNode
        | Escrow | FeeSettings | LedgerHashes | NegativeUNL | Offer
        | PayChannel | RippleState | SignerList | Ticket)[]
    // TODO: Should every sub-type in state have index as a field?
    marker: any
}