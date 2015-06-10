'use strict';
const Transaction = require('./core').Transaction;
const flagIndices = Transaction.set_clear_flags.AccountSet;

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
  Sequence: {name: 'sequence'},
  EmailHash: {name: 'emailHash', encoding: 'hex',
              length: 32, defaults: '0'},
  WalletLocator: {name: 'walletLocator', encoding: 'hex',
                  length: 64, defaults: '0'},
  WalletSize: {name: 'walletSize', defaults: 0},
  MessageKey: {name: 'messageKey'},
  Domain: {name: 'domain', encoding: 'hex'},
  TransferRate: {name: 'transferRate', defaults: 0},
  Signers: {name: 'signers'}
};

module.exports = {
  AccountFields,
  AccountFlagIndices
};
