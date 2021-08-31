import BaseLedgerEntry from "./baseLedgerEntry";

export default interface LedgerHashes extends BaseLedgerEntry {
  LedgerEntryType: "LedgerHashes";
  LastLedgerSequence?: number;
  Hashes: string[];
  Flags: number;
}
