'use strict';

module.exports = {
  submit: require('./submit'),
  ledger: require('./ledger'),
  subscribe: require('./subscribe'),
  account_info: {
    normal: require('./account-info'),
    notfound: require('./account-info-not-found')
  },
  account_offers: require('./account-offers'),
  account_tx: require('./account-tx'),
  book_offers: require('./book-offers'),
  server_info: require('./server-info'),
  ripple_path_find: require('./ripple-path-find'),
  tx: {
    Payment: require('./tx/payment.json'),
    AccountSet: require('./tx/account-set.json'),
    OfferCreate: require('./tx/offer-create.json'),
    OfferCancel: require('./tx/offer-cancel.json'),
    TrustSet: require('./tx/trust-set.json'),
    NotFound: require('./tx/not-found.json')
  }
};
