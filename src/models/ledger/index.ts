import { Ticket } from "../../transaction/ticket";
import { AccountRoot } from "./account_root";
import { Amendments } from "./amendments";
import { Check } from "./check";
import { DepositPreauth } from "./deposit_preauth";
import { DirectoryNode } from "./directory_node";
import { Escrow } from "./escrow";
import { FeeSettings } from "./fee_settings";
import { LedgerHashes } from "./ledger_hashes";
import { NegativeUNL } from "./negative_unl";
import { Offer } from "./offer";
import { PayChannel } from "./pay_channel";
import { RippleState } from "./ripple_state";
import { SignerList } from "./signer_list";

export type LedgerEntry = AccountRoot 
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
                        | Ticket

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
    Ticket
}