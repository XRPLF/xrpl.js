import AccountRoot from './AccountRoot'
import Amendments from './Amendments'
import AMM from './AMM'
import Bridge from './Bridge'
import Check from './Check'
import Credential from './Credential'
import DepositPreauth from './DepositPreauth'
import DirectoryNode from './DirectoryNode'
import Escrow from './Escrow'
import FeeSettings from './FeeSettings'
import LedgerHashes from './LedgerHashes'
import NegativeUNL from './NegativeUNL'
import Offer from './Offer'
import Oracle from './Oracle'
import PayChannel from './PayChannel'
import PermissionedDomain from './PermissionedDomain'
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
  | Credential
  | DepositPreauth
  | DirectoryNode
  | Escrow
  | FeeSettings
  | LedgerHashes
  | NegativeUNL
  | Offer
  | Oracle
  | PayChannel
  | PermissionedDomain
  | RippleState
  | SignerList
  | Ticket
  | XChainOwnedClaimID
  | XChainOwnedCreateAccountClaimID

type LedgerEntryFilter =
  | 'account'
  | 'amendments'
  | 'amm'
  | 'bridge'
  | 'check'
  | 'credential'
  | 'deposit_preauth'
  | 'did'
  | 'directory'
  | 'escrow'
  | 'fee'
  | 'hashes'
  | 'mpt_issuance'
  | 'mptoken'
  | 'nft_offer'
  | 'nft_page'
  | 'offer'
  | 'oracle'
  | 'payment_channel'
  | 'permissioned_domain'
  | 'signer_list'
  | 'state'
  | 'ticket'
  | 'xchain_owned_create_account_claim_id'
  | 'xchain_owned_claim_id'

export { LedgerEntry, LedgerEntryFilter }
