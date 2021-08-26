import { AccountRoot } from "./accountRoot";
import { Amendments } from "./amendments";
import { Check } from "./check";
import { DepositPreauth } from "./depositPreauth";
import { DirectoryNode } from "./directoryNode";
import { Escrow } from "./escrow";
import { FeeSettings } from "./feeSettings";
import { Ledger } from "./ledger";
import { LedgerHashes } from "./ledgerHashes";
import { NegativeUNL } from "./negativeUNL";
import { Offer } from "./offer";
import { PayChannel } from "./payChannel";
import { RippleState } from "./rippleState";
import { SignerList } from "./signerList";
import { Ticket } from "./ticket";

export type LedgerEntry =
  | AccountRoot
  | Amendments
  | Check
  | DepositPreauth
  | DirectoryNode
  | Escrow
  | FeeSettings
  | LedgerHashes
  | NegativeUNL
  | Offer
  | PayChannel
  | RippleState
  | SignerList
  | Ticket;

export {
  AccountRoot,
  Amendments,
  Check,
  DepositPreauth,
  DirectoryNode,
  Escrow,
  FeeSettings,
  LedgerHashes,
  NegativeUNL,
  Offer,
  PayChannel,
  RippleState,
  SignerList,
  Ticket,
  Ledger,
};
