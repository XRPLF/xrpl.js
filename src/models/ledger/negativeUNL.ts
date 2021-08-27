import { BaseLedgerEntry } from "./baseLedgerEntry";

interface DisabledValidator {
  FirstLedgerSequence: number;
  PublicKey: string;
}

export interface NegativeUNL extends BaseLedgerEntry {
  LedgerEntryType: "NegativeUNL";
  DisabledValidators?: DisabledValidator[];
  ValidatorToDisable?: string;
  ValidatorToReEnable?: string;
}
