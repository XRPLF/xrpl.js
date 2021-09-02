import { IssuedCurrencyAmount } from "../common";

import BaseLedgerEntry from "./baseLedgerEntry";

export default interface RippleState extends BaseLedgerEntry {
  LedgerEntryType: "RippleState";
  Flags: number;
  Balance: IssuedCurrencyAmount;
  LowLimit: IssuedCurrencyAmount;
  HighLimit: IssuedCurrencyAmount;
  PreviousTxnID: string;
  PreviousTxnLgrSeq: number;
  LowNode?: string;
  HighNode?: string;
  LowQualityIn?: number;
  LowQualityOut?: number;
  HighQualityIn?: number;
  HighQualityOut?: number;
}
