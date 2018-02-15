
import {txFlagIndices} from './txflags'

const accountRootFlags = {
  PasswordSpent: 0x00010000, // password set fee is spent
  RequireDestTag: 0x00020000, // require a DestinationTag for payments
  RequireAuth: 0x00040000, // require authorization to hold IOUs
  DepositAuth: 0x01000000, // require account to auth deposits
  DisallowXRP: 0x00080000, // disallow sending XRP
  DisableMaster: 0x00100000, // force regular key
  NoFreeze: 0x00200000, // permanently disallowed freezing trustlines
  GlobalFreeze: 0x00400000, // trustlines globally frozen
  DefaultRipple: 0x00800000
}

const AccountFlags = {
  passwordSpent: accountRootFlags.PasswordSpent,
  requireDestinationTag: accountRootFlags.RequireDestTag,
  requireAuthorization: accountRootFlags.RequireAuth,
  depositAuth: accountRootFlags.DepositAuth,
  disallowIncomingXRP: accountRootFlags.DisallowXRP,
  disableMasterKey: accountRootFlags.DisableMaster,
  noFreeze: accountRootFlags.NoFreeze,
  globalFreeze: accountRootFlags.GlobalFreeze,
  defaultRipple: accountRootFlags.DefaultRipple
}

const AccountFlagIndices = {
  requireDestinationTag: txFlagIndices.AccountSet.asfRequireDest,
  requireAuthorization: txFlagIndices.AccountSet.asfRequireAuth,
  depositAuth: txFlagIndices.AccountSet.asfDepositAuth,
  disallowIncomingXRP: txFlagIndices.AccountSet.asfDisallowXRP,
  disableMasterKey: txFlagIndices.AccountSet.asfDisableMaster,
  enableTransactionIDTracking: txFlagIndices.AccountSet.asfAccountTxnID,
  noFreeze: txFlagIndices.AccountSet.asfNoFreeze,
  globalFreeze: txFlagIndices.AccountSet.asfGlobalFreeze,
  defaultRipple: txFlagIndices.AccountSet.asfDefaultRipple
}

const AccountFields = {
  EmailHash: {name: 'emailHash', encoding: 'hex',
    length: 32, defaults: '0'},
  MessageKey: {name: 'messageKey'},
  Domain: {name: 'domain', encoding: 'hex'},
  TransferRate: {name: 'transferRate', defaults: 0, shift: 9}
}

export {
  AccountFields,
  AccountFlagIndices,
  AccountFlags
}
