import { BaseLedgerEntry } from "./baseLedgerEntry";

export interface LedgerHashes extends BaseLedgerEntry {
  LedgerEntryType: "LedgerHashes";
  LastLedgerSequence?: number;
  Hashes: string[];
  Flags: number;
}
