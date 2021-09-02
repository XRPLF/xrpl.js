import BaseLedgerEntry from './baseLedgerEntry'

interface DisabledValidator {
  FirstLedgerSequence: number
  PublicKey: string
}

export default interface NegativeUNL extends BaseLedgerEntry {
  LedgerEntryType: 'NegativeUNL'
  DisabledValidators?: DisabledValidator[]
  ValidatorToDisable?: string
  ValidatorToReEnable?: string
}
