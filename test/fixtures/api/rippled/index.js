'use strict';

module.exports = {
  misc: require('./mock'),
  account_offers: require('./account-offers'),
  account_tx: require('./account-tx'),
  book_offers: require('./book-offers'),
  ripple_path_find: require('./ripple-path-find'),
  tx: {
    AccountSet: require('./tx/account-set.json'),
    OfferCreate: require('./tx/offer-create.json'),
    OfferCancel: require('./tx/offer-cancel.json'),
    TrustSet: require('./tx/trust-set.json')
  }
};
