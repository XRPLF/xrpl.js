import AccountRoot from './AccountRoot'
import Amendments from './Amendments'
import AMM from './AMM'
import Ballot from './Ballot'
import BallotVote from './BallotVote'
import Beneficiary from './Beneficiary'
import Check from './Check'
import CouponSchedule from './CouponSchedule'
import Credential from './Credential'
import Delegate from './Delegate'
import DepositPreauth from './DepositPreauth'
import DirectoryNode from './DirectoryNode'
import Escrow from './Escrow'
import FeeSettings from './FeeSettings'
import Firewall from './Firewall'
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
import Repo from './Repo'
import RippleState from './RippleState'
import SignerList from './SignerList'
import Sponsorship from './Sponsorship'
import Ticket from './Ticket'
import TokenIssuance from './TokenIssuance'
import TransactionProposal from './TransactionProposal'
import Vault from './Vault'
import WithdrawPreauth from './WithdrawPreauth'

type LedgerEntry =
  | AccountRoot
  | Amendments
  | AMM
  | Ballot
  | BallotVote
  | Beneficiary
  | Check
  | CouponSchedule
  | Credential
  | Delegate
  | DepositPreauth
  | DirectoryNode
  | Escrow
  | FeeSettings
  | Firewall
  | LedgerHashes
  | Loan
  | LoanBroker
  | NegativeUNL
  | Offer
  | Oracle
  | PasskeyList
  | PayChannel
  | PermissionedDomain
  | Repo
  | RippleState
  | SignerList
  | Sponsorship
  | Ticket
  | TokenIssuance
  | TransactionProposal
  | Vault
  | WithdrawPreauth
  | MPTokenIssuance

type LedgerEntryFilter =
  | 'account'
  | 'amendments'
  | 'amm'
  | 'ballot'
  | 'ballot_vote'
  | 'beneficiary'
  | 'check'
  | 'coupon_schedule'
  | 'credential'
  | 'delegate'
  | 'deposit_preauth'
  | 'did'
  | 'directory'
  | 'escrow'
  | 'fee'
  | 'firewall'
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
  | 'repo'
  | 'signer_list'
  | 'sponsorship'
  | 'state'
  | 'ticket'
  | 'token_issuance'
  | 'transaction_proposal'
  | 'vault'
  | 'withdraw_preauth'

export { LedgerEntry, LedgerEntryFilter }
