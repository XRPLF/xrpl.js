interface DisabledValidator {
    FirstLedgerSequence: number
    PublicKey: string
}

export interface NegativeUNL {
    LedgerEntryType: "NegativeUNL"
    DisabledValidators?: DisabledValidator[]
    ValidatorToDisable?: string
    ValidatorToReEnable?: string
}