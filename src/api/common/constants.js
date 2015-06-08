'use strict';
const ripple = require('./core');

const AccountRootFlags = {
  PasswordSpent: {
    name: 'password_spent',
    value: ripple.Remote.flags.account_root.PasswordSpent
  },
  RequireDestTag: {
    name: 'require_destination_tag',
    value: ripple.Remote.flags.account_root.RequireDestTag
  },
  RequireAuth: {
    name: 'require_authorization',
    value: ripple.Remote.flags.account_root.RequireAuth
  },
  DisallowXRP: {
    name: 'disallow_xrp',
    value: ripple.Remote.flags.account_root.DisallowXRP
  },
  DisableMaster: {
    name: 'disable_master',
    value: ripple.Remote.flags.account_root.DisableMaster
  },
  NoFreeze: {
    name: 'no_freeze',
    value: ripple.Remote.flags.account_root.NoFreeze
  },
  GlobalFreeze: {
    name: 'global_freeze',
    value: ripple.Remote.flags.account_root.GlobalFreeze
  },
  DefaultRipple: {
    name: 'default_ripple',
    value: ripple.Remote.flags.account_root.DefaultRipple
  }
};

const AccountRootFields = {
  Sequence: {name: 'sequence'},
  EmailHash: {name: 'emailHash', encoding: 'hex', length: 32, defaults: '0'},
  WalletLocator: {name: 'walletLocator', encoding: 'hex',
                  length: 64, defaults: '0'},
  WalletSize: {name: 'walletSize', defaults: 0},
  MessageKey: {name: 'messageKey'},
  Domain: {name: 'domain', encoding: 'hex'},
  TransferRate: {name: 'transferRate', defaults: 0},
  Signers: {name: 'signers'}
};

const AccountSetIntFlags = {
  noFreeze: ripple.Transaction.set_clear_flags.AccountSet.asfNoFreeze,
  globalFreeze: ripple.Transaction.set_clear_flags.AccountSet.asfGlobalFreeze,
  defaultRipple: ripple.Transaction.set_clear_flags.AccountSet.asfDefaultRipple
};

const AccountSetFlags = {
  requireDestinationTag: {set: 'RequireDestTag', unset: 'OptionalDestTag'},
  requireAuthorization: {set: 'RequireAuth', unset: 'OptionalAuth'},
  disallowIncomingXRP: {set: 'DisallowXRP', unset: 'AllowXRP'}
};

const AccountSetResponseFlags = {
  RequireDestTag: {name: 'require_destination_tag',
    value: ripple.Transaction.flags.AccountSet.RequireDestTag},
  RequireAuth: {name: 'require_authorization',
    value: ripple.Transaction.flags.AccountSet.RequireAuth},
  DisallowXRP: {name: 'disallow_xrp',
    value: ripple.Transaction.flags.AccountSet.DisallowXRP}
};

const OfferCreateFlags = {
  Passive: {name: 'passive',
    value: ripple.Transaction.flags.OfferCreate.Passive},
  ImmediateOrCancel: {name: 'immediate_or_cancel',
    value: ripple.Transaction.flags.OfferCreate.ImmediateOrCancel},
  FillOrKill: {name: 'fill_or_kill',
    value: ripple.Transaction.flags.OfferCreate.FillOrKill},
  Sell: {name: 'sell', value: ripple.Transaction.flags.OfferCreate.Sell}
};

const TrustSetResponseFlags = {
  NoRipple: {name: 'prevent_rippling',
    value: ripple.Transaction.flags.TrustSet.NoRipple},
  SetFreeze: {name: 'account_trustline_frozen',
    value: ripple.Transaction.flags.TrustSet.SetFreeze},
  SetAuth: {name: 'authorized',
    value: ripple.Transaction.flags.TrustSet.SetAuth}
};

module.exports = {
  AccountRootFlags: AccountRootFlags,
  AccountRootFields: AccountRootFields,
  AccountSetIntFlags: AccountSetIntFlags,
  AccountSetFlags: AccountSetFlags,
  AccountSetResponseFlags: AccountSetResponseFlags,
  OfferCreateFlags: OfferCreateFlags,
  TrustSetResponseFlags: TrustSetResponseFlags
};
