import { TRANSACTION_TYPES } from 'ripple-binary-codec'

/**
 * Alphanet transaction types that have models in `src/models/transactions`
 * but no entry yet in ripple-binary-codec's `definitions.json`, which is
 * regenerated from the alphanet node's `server_definitions` once the node
 * runs them. `validateBaseTransaction` rejects a TransactionType the codec
 * does not know, so the unit tests register these names first. Remove a name
 * once `definitions.json` carries it.
 */
const ALPHANET_TRANSACTION_TYPES = [
  'BeneficiarySet',
  'PasskeyListSet',
  'TokenIssuanceCreate',
  'TokenIssuanceSet',
  'TokenIssuanceDestroy',
  'TokenConvert',
  'RepoCreate',
  'RepoAccept',
  'RepoCancel',
  'RepoClose',
  'RepoDefault',
  'FirewallSet',
  'FirewallDelete',
  'WithdrawPreauth',
  'SubscriptionSet',
  'SubscriptionCancel',
  'SubscriptionClaim',
  'BallotCreate',
  'BallotCastVote',
  'BallotFinalize',
  'BallotDelete',
  'CouponScheduleCreate',
  'CouponScheduleSet',
  'CouponScheduleDelete',
  'CouponClaim',
  'CouponPay',
  'AMMBinCreate',
  'AMMBinDestroy',
  'AMMCollectFees',
  'AMMPositionTransfer',
]

ALPHANET_TRANSACTION_TYPES.filter(
  (name) => !TRANSACTION_TYPES.includes(name),
).forEach((name) => TRANSACTION_TYPES.push(name))
