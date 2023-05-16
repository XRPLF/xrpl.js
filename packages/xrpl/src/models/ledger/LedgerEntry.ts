import AccountRoot from './AccountRoot'
import Amendments from './Amendments'
import AMM from './AMM'
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

type LedgerEntry =
  | AccountRoot
  | Amendments
  | AMM
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

export default LedgerEntry
