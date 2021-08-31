import BaseLedgerEntry from "./baseLedgerEntry";

export default interface FeeSettings extends BaseLedgerEntry {
  LedgerEntryType: "FeeSettings";
  BaseFee: string;
  ReferenceFeeUnits: number;
  ReserveBase: number;
  ReserveIncrement: number;
  Flags: number;
}
