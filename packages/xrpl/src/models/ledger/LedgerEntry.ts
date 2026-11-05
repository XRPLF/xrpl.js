import AccountRoot from './AccountRoot'
import Amendments from './Amendments'
import AMM from './AMM'
import AMMBin from './AMMBin'
import AMMBinHolding from './AMMBinHolding'
import AMMPosition from './AMMPosition'
import AMMTick from './AMMTick'
import AMMTickBitmap from './AMMTickBitmap'
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
import MarginAccount from './MarginAccount'
import MarginPosition from './MarginPosition'
import { MPTokenIssuance } from './MPTokenIssuance'
import NegativeUNL from './NegativeUNL'
import Offer from './Offer'
import Oracle from './Oracle'
import PasskeyList from './PasskeyList'
import PayChannel from './PayChannel'
import PermissionedDomain from './PermissionedDomain'
import Repo from './Repo'
import PerpExchange from './PerpExchange'
import PerpMarket from './PerpMarket'
import PerpOrder from './PerpOrder'
import RippleState from './RippleState'
import SignerList from './SignerList'
import Sponsorship from './Sponsorship'
import Subscription from './Subscription'
import Ticket from './Ticket'
import TokenIssuance from './TokenIssuance'
import TransactionProposal from './TransactionProposal'
import Vault from './Vault'
import WithdrawPreauth from './WithdrawPreauth'

type LedgerEntry =
  | AccountRoot
  | Amendments
  | AMM
  | AMMBin
  | AMMBinHolding
  | AMMPosition
  | AMMTick
  | AMMTickBitmap
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
  | MarginAccount
  | MarginPosition
  | NegativeUNL
  | Offer
  | Oracle
  | PasskeyList
  | PayChannel
  | PermissionedDomain
  | Repo
  | PerpExchange
  | PerpMarket
  | PerpOrder
  | RippleState
  | SignerList
  | Sponsorship
  | Subscription
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
  | 'amm_bin'
  | 'amm_bin_holding'
  | 'amm_position'
  | 'amm_tick'
  | 'amm_tick_bitmap'
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
  | 'margin_account'
  | 'margin_position'
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
  | 'perp_exchange'
  | 'perp_market'
  | 'perp_order'
  | 'signer_list'
  | 'sponsorship'
  | 'state'
  | 'subscription'
  | 'ticket'
  | 'token_issuance'
  | 'transaction_proposal'
  | 'vault'
  | 'withdraw_preauth'

export { LedgerEntry, LedgerEntryFilter }
