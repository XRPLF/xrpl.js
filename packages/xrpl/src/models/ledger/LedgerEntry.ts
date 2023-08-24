import AccountRoot from './AccountRoot'
import Amendments from './Amendments'
import AMM from './AMM'
import Bridge from './Bridge'
import Check from './Check'
import DepositPreauth from './DepositPreauth'
import DirectoryNode from './DirectoryNode'
import Escrow from './Escrow'
import FeeSettings from './FeeSettings'
import LedgerHashes from './LedgerHashes'
import NegativeUNL from './NegativeUNL'
import Offer from './Offer'
import PayChannel from './PayChannel'
import RippleState from './RippleState'
import SignerList from './SignerList'
import Ticket from './Ticket'
import XChainOwnedClaimID from './XChainOwnedClaimID'
import XChainOwnedCreateAccountClaimID from './XChainOwnedCreateAccountClaimID'

type LedgerEntry =
  | AccountRoot
  | Amendments
  | AMM
  | Bridge
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
  | XChainOwnedClaimID
  | XChainOwnedCreateAccountClaimID

export default LedgerEntry
