'use strict';
const utils = require('./utils');

// rippled 'account_lines' returns a different format for
// trustlines than 'tx'
function parseAccountTrustline(trustline) {
  const specification = utils.removeUndefined({
    limit: trustline.limit,
    currency: trustline.currency,
    counterparty: trustline.account,
    qualityIn: trustline.quality_in || undefined,
    qualityOut: trustline.quality_out || undefined,
    disableRippling: trustline.no_ripple,
    frozen: trustline.freeze,
    authorized: trustline.authorized
  });
  // rippled doesn't provide the counterparty's qualities
  const counterparty = utils.removeUndefined({
    limit: trustline.limit_peer,
    disableRippling: trustline.no_ripple_peer,
    frozen: trustline.freeze_peer,
    authorized: trustline.peer_authorized
  });
  const state = {
    balance: trustline.balance
  };
  return {specification, counterparty, state};
}

module.exports = parseAccountTrustline;
