import { BaseLedgerEntry } from "./base_ledger_entry";

interface DisabledValidator {
    FirstLedgerSequence: number
    PublicKey: string
}

export interface NegativeUNL extends BaseLedgerEntry {
    LedgerEntryType: "NegativeUNL"
    DisabledValidators?: DisabledValidator[]
    ValidatorToDisable?: string
    ValidatorToReEnable?: string
}