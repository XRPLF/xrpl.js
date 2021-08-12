import { Amount } from ".";

interface CreatedNode {
    CreatedNode: {
        LedgerEntryType: string
        LedgerIndex: string
        NewFields: {[field: string]: any}
    }
}

interface ModifiedNode {
    ModifiedNode: {
        LedgerEntryType: string
        LedgerIndex: string
        FinalFields: {[field: string]: any}
        PreviousFields: {[field: string]: any}
        PreviousTxnID?: string
        PreviouTxnLgrSeq?: number
    }
}

interface DeletedNode {
    DeletedNode: {
        LedgerEntryType: string
        LedgerIndex: string
        FinalFields: {[field: string]: any}
    }
}

type Node = CreatedNode | ModifiedNode | DeletedNode

export interface TransactionMetadata {
    AffectedNodes: Node[]
    DeliveredAmount?: Amount
    delivered_amount?: Amount
    TransactionIndex: number
    TransactionResult: string
}