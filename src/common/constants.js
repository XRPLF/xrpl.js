'use strict';
const flagIndices = require('./txflags').txFlagIndices.AccountSet;

const accountRootFlags = {
  PasswordSpent: 0x00010000, // password set fee is spent
  RequireDestTag: 0x00020000, // require a DestinationTag for payments
  RequireAuth: 0x00040000, // require a authorization to hold IOUs
  DisallowXRP: 0x00080000, // disallow sending XRP
  DisableMaster: 0x00100000,  // force regular key
  NoFreeze: 0x00200000, // permanently disallowed freezing trustlines
  GlobalFreeze: 0x00400000, // trustlines globally frozen
  DefaultRipple: 0x00800000
};

const AccountFlags = {
  passwordSpent: accountRootFlags.PasswordSpent,
  requireDestinationTag: accountRootFlags.RequireDestTag,
  requireAuthorization: accountRootFlags.RequireAuth,
  disallowIncomingXRP: accountRootFlags.DisallowXRP,
  disableMasterKey: accountRootFlags.DisableMaster,
  noFreeze: accountRootFlags.NoFreeze,
  globalFreeze: accountRootFlags.GlobalFreeze,
  defaultRipple: accountRootFlags.DefaultRipple
};

const AccountFlagIndices = {
  requireDestinationTag: flagIndices.asfRequireDest,
  requireAuthorization: flagIndices.asfRequireAuth,
  disallowIncomingXRP: flagIndices.asfDisallowXRP,
  disableMasterKey: flagIndices.asfDisableMaster,
  enableTransactionIDTracking: flagIndices.asfAccountTxnID,
  noFreeze: flagIndices.asfNoFreeze,
  globalFreeze: flagIndices.asfGlobalFreeze,
  defaultRipple: flagIndices.asfDefaultRipple
};

const AccountFields = {
  EmailHash: {name: 'emailHash', encoding: 'hex',
              length: 32, defaults: '0'},
  WalletLocator: {name: 'walletLocator', encoding: 'hex',
                  length: 64, defaults: '0'},
  WalletSize: {name: 'walletSize', defaults: 0},
  MessageKey: {name: 'messageKey'},
  Domain: {name: 'domain', encoding: 'hex'},
  TransferRate: {name: 'transferRate', defaults: 0, shift: 9},
  Signers: {name: 'signers'}
};

module.exports = {
  AccountFields,
  AccountFlagIndices,
  AccountFlags
};
