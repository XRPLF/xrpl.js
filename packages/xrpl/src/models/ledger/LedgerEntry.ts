import AccountRoot from './AccountRoot'
import Amendments from './Amendments'
import AMM from './AMM'
import Beneficiary from './Beneficiary'
import Check from './Check'
import Credential from './Credential'
import Delegate from './Delegate'
import DepositPreauth from './DepositPreauth'
import DirectoryNode from './DirectoryNode'
import Escrow from './Escrow'
import FeeSettings from './FeeSettings'
import LedgerHashes from './LedgerHashes'
import Loan from './Loan'
import LoanBroker from './LoanBroker'
import { MPTokenIssuance } from './MPTokenIssuance'
import NegativeUNL from './NegativeUNL'
import Offer from './Offer'
import Oracle from './Oracle'
import PasskeyList from './PasskeyList'
import PayChannel from './PayChannel'
import PermissionedDomain from './PermissionedDomain'
import RippleState from './RippleState'
import SignerList from './SignerList'
import Sponsorship from './Sponsorship'
import Ticket from './Ticket'
import TokenIssuance from './TokenIssuance'
import TransactionProposal from './TransactionProposal'
import Vault from './Vault'

type LedgerEntry =
  | AccountRoot
  | Amendments
  | AMM
  | Beneficiary
  | Check
  | Credential
  | Delegate
  | DepositPreauth
  | DirectoryNode
  | Escrow
  | FeeSettings
  | LedgerHashes
  | Loan
  | LoanBroker
  | NegativeUNL
  | Offer
  | Oracle
  | PasskeyList
  | PayChannel
  | PermissionedDomain
  | RippleState
  | SignerList
  | Sponsorship
  | Ticket
  | TokenIssuance
  | TransactionProposal
  | Vault
  | MPTokenIssuance

type LedgerEntryFilter =
  | 'account'
  | 'amendments'
  | 'amm'
  | 'beneficiary'
  | 'check'
  | 'credential'
  | 'delegate'
  | 'deposit_preauth'
  | 'did'
  | 'directory'
  | 'escrow'
  | 'fee'
  | 'hashes'
  | 'loan'
  | 'loan_broker'
  | 'mpt_issuance'
  | 'mptoken'
  | 'nft_offer'
  | 'nft_page'
  | 'offer'
  | 'oracle'
  | 'passkey_list'
  | 'payment_channel'
  | 'permissioned_domain'
  | 'signer_list'
  | 'sponsorship'
  | 'state'
  | 'ticket'
  | 'token_issuance'
  | 'transaction_proposal'
  | 'vault'

export { LedgerEntry, LedgerEntryFilter }
