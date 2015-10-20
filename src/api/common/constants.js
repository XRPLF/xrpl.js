'use strict';
const core = require('./utils').core;
const flagIndices = require('./txflags').txFlagIndices.AccountSet;
const flags = core.Remote.flags.account_root;

const AccountFlags = {
  passwordSpent: flags.PasswordSpent,
  requireDestinationTag: flags.RequireDestTag,
  requireAuthorization: flags.RequireAuth,
  disallowIncomingXRP: flags.DisallowXRP,
  disableMasterKey: flags.DisableMaster,
  noFreeze: flags.NoFreeze,
  globalFreeze: flags.GlobalFreeze,
  defaultRipple: flags.DefaultRipple
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
