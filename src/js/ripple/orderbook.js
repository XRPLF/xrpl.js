// Routines for working with an orderbook.
//
// One OrderBook object represents one half of an order book. (i.e. bids OR
// asks) Which one depends on the ordering of the parameters.
//
// Events:
//  - model
//  - trade
//  - transaction

var util         = require('util');
var extend       = require('extend');
var assert       = require('assert');
var async        = require('async');
var EventEmitter = require('events').EventEmitter;
var Amount       = require('./amount').Amount;
var UInt160      = require('./uint160').UInt160;
var Currency     = require('./currency').Currency;
var log          = require('./log').internal.sub('orderbook');

/**
 * @constructor OrderBook
 * @param {Remote} remote
 * @param {String} ask currency
 * @param {String} ask issuer
 * @param {String} bid currency
 * @param {String} bid issuer
 * @param {String} orderbook key
 */

function OrderBook(remote, getsC, getsI, paysC, paysI, key) {
  EventEmitter.call(this);

  var self = this;

  this._remote = remote;
  this._currencyGets = Currency.from_json(getsC);
  this._issuerGets = getsI;
  this._currencyPays = Currency.from_json(paysC);
  this._issuerPays = paysI;
  this._key = key;
  this._subscribed = false;
  this._shouldSubscribe = true;
  this._listeners = 0;
  this._offers = [ ];
  this._ownerFunds = { };
  this._offerCounts = { };

  // We consider ourselves synchronized if we have a current
  // copy of the offers, we are online and subscribed to updates.
  this._synchronized = false;

  function listenersModified(action, event) {
    // Automatically subscribe and unsubscribe to orderbook
    // on the basis of existing event listeners
    if (~OrderBook.EVENTS.indexOf(event)) {
      switch (action) {
        case 'add':
          if (++self._listeners === 1) {
            self.subscribe();
          }
          break;
        case 'remove':
          if (--self._listeners === 0) {
            self.unsubscribe();
          }
          break;
      }
    }
  };

  this.on('newListener', function(event) {
    listenersModified('add', event);
  });

  this.on('removeListener', function(event) {
    listenersModified('remove', event);
  });

  this.on('unsubscribe', function() {
    self.resetCache();
    self._remote.removeListener('transaction', updateFundedAmounts);
    self._remote.removeListener('transaction', updateTransferRate);
  });

  this._remote.once('prepare_subscribe', function() {
    self.subscribe();
  });

  this._remote.on('disconnect', function() {
    self.resetCache();
    self._remote.once('prepare_subscribe', function() {
      self.subscribe();
    });
  });

  function updateFundedAmounts(message) {
    self.updateFundedAmounts(message);
  };

  this._remote.on('transaction', updateFundedAmounts);

  function updateTransferRate(message) {
    self.updateTransferRate(message);
  };

  this._remote.on('transaction', updateTransferRate);

  return this;
};

util.inherits(OrderBook, EventEmitter);

/**
 * Events emitted from OrderBook
 */

OrderBook.EVENTS = [ 'transaction', 'model', 'trade', 'offer' ];

OrderBook.DEFAULT_TRANSFER_RATE = 1000000000;

/**
 * Whether the OrderBook is valid.
 *
 * Note: This only checks whether the parameters (currencies and issuer) are
 *       syntactically valid. It does not check anything against the ledger.
 *
 * @return {Boolean} is valid
 */

OrderBook.prototype.isValid =
OrderBook.prototype.is_valid = function() {
  // XXX Should check for same currency (non-native) && same issuer
  return (
    this._currencyPays && this._currencyPays.is_valid() &&
    (this._currencyPays.is_native() || UInt160.is_valid(this._issuerPays)) &&
    this._currencyGets && this._currencyGets.is_valid() &&
    (this._currencyGets.is_native() || UInt160.is_valid(this._issuerGets)) &&
    !(this._currencyPays.is_native() && this._currencyGets.is_native())
  );
};

/**
 * Initialize orderbook. Get orderbook offers and subscribe to transactions
 */

OrderBook.prototype.subscribe = function() {
  var self = this;

  if (!this._shouldSubscribe) {
    return;
  }

  if (this._remote.trace) {
    log.info('subscribing', this._key);
  }

  var steps = [
    function(callback) {
      self.requestTransferRate(callback);
    },
    function(callback) {
      self.requestOffers(callback);
    },
    function(callback) {
      self.subscribeTransactions(callback);
    }
  ];

  async.series(steps, function(err) {
    //XXX What now?
  });
};

/**
 * Unhook event listeners and prevent ripple-lib from further work on this
 * orderbook. There is no more orderbook stream, so "unsubscribe" is nominal
 */

OrderBook.prototype.unsubscribe = function() {
  var self = this;

  if (this._remote.trace) {
    log.info('unsubscribing', this._key);
  }

  this._subscribed = false;
  this._shouldSubscribe = false;

  OrderBook.EVENTS.forEach(function(event) {
    if (self.listeners(event).length > 0) {
      self.removeAllListeners(event);
    }
  });

  this.emit('unsubscribe');
};

/**
 * Reset cached owner funds, offer counts
 */

OrderBook.prototype.resetCache = function() {
  this._ownerFunds = { };
  this._offerCounts = { };
  this._synchronized = false;
};

/**
 * Check that the funds for offer owner have been cached
 *
 * @param {String} account address
 */

OrderBook.prototype.hasCachedFunds = function(account) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  return this._ownerFunds[account] !== void(0);
};

/**
 * Add cached offer owner funds
 *
 * @param {String} account address
 * @param {String} funded amount
 */

OrderBook.prototype.addCachedFunds = function(account, fundedAmount) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  assert(!isNaN(fundedAmount), 'Funded amount is invalid');
  this._ownerFunds[account] = fundedAmount;
};

/**
 * Get cached offer owner funds
 *
 * @param {String} account address
 */

OrderBook.prototype.getCachedFunds = function(account) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  return this._ownerFunds[account];
};

/**
 * Remove cached offer owner funds
 *
 * @param {String} account address
 */

OrderBook.prototype.removeCachedFunds = function(account) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  this._ownerFunds[account] = void(0);
};

/**
 * Get offer count for offer owner
 */

OrderBook.prototype.getOfferCount = function(account) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  return this._offerCounts[account] || 0;
};

/**
 * Increment offer count for offer owner
 */

OrderBook.prototype.incrementOfferCount = function(account) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  var result = (this._offerCounts[account] || 0) + 1;
  this._offerCounts[account] = result;
  return result;
};

/**
 * Decrement offer count for offer owner
 */

OrderBook.prototype.decrementOfferCount = function(account) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  var result = (this._offerCounts[account] || 1) - 1;
  this._offerCounts[account] = result;
  return result;
};

/**
 * Compute funded amount for a balance/transferRate
 *
 * @param {String} balance
 * @param [String] transferRate
 * @return {Amount} funded amount
 */

OrderBook.prototype.applyTransferRate = function(balance, transferRate) {
  assert(!isNaN(balance), 'Balance is invalid');

  if (this._currencyGets.is_native()) {
    return balance;
  }

  if (transferRate === void(0)) {
    transferRate = this._issuerTransferRate;
  }

  assert(!isNaN(transferRate), 'Transfer rate is invalid');

  if (transferRate === OrderBook.DEFAULT_TRANSFER_RATE) {
    return balance;
  }

  var iouSuffix = '/USD/rrrrrrrrrrrrrrrrrrrrBZbvji';
  var adjustedBalance = Amount.from_json(balance + iouSuffix)
  .divide(transferRate)
  .multiply(Amount.from_json(OrderBook.DEFAULT_TRANSFER_RATE))
  .to_json()
  .value;

  return adjustedBalance;
};

/**
 * Request transfer rate for this orderbook's issuer
 *
 * @param [Function] calback
 */

OrderBook.prototype.requestTransferRate = function(callback) {
  var self = this;
  var issuer = this._issuerGets;

  this.once('transfer_rate', function(rate) {
    if (typeof callback === 'function') {
      callback(null, rate);
    }
  });

  if (this._currencyGets.is_native()) {
    // Transfer rate is default
    return this.emit('transfer_rate', OrderBook.DEFAULT_TRANSFER_RATE);
  }

  if (this._issuerTransferRate) {
    // Transfer rate has been cached
    return this.emit('transfer_rate', this._issuerTransferRate);
  }

  this._remote.requestAccountInfo({account: issuer}, function(err, info) {
    if (err) {
      // XXX What now?
      return callback(err);
    }

    var transferRate = info.account_data.TransferRate
    || OrderBook.DEFAULT_TRANSFER_RATE;

    self._issuerTransferRate = transferRate;
    self.emit('transfer_rate', transferRate);
  });
};

/**
 * Set funded amount on offer. All offers have taker_gets_funded property,
 * which reflects the amount this account can afford to offer. All offers have
 * is_fully_funded property, indicating whether these funds are sufficient for
 * the offer placed.
 *
 * @param {Object} offer
 * @param {String} funds
 * @return offer
 */

OrderBook.prototype.setFundedAmount = function(offer, fundedAmount) {
  assert.strictEqual(typeof offer, 'object', 'Offer is invalid');
  assert(!isNaN(fundedAmount), 'Funds is invalid');

  if (fundedAmount === '0') {
    offer.taker_gets_funded = '0';
    offer.taker_pays_funded = '0';
    offer.is_fully_funded = false;
    return offer;
  }

  var iouSuffix = '/' + this._currencyGets.to_json()
                + '/' + this._issuerGets;

  offer.is_fully_funded = Amount.from_json(
    this._currencyGets.is_native() ? fundedAmount : fundedAmount + iouSuffix
  ).compareTo(Amount.from_json(offer.TakerGets)) >= 0;

  if (offer.is_fully_funded) {
    offer.taker_gets_funded = Amount.from_json(offer.TakerGets).to_text();
    offer.taker_pays_funded = Amount.from_json(offer.TakerPays).to_text();
    return offer;
  }

  offer.taker_gets_funded = fundedAmount;

  var takerPaysValue = typeof offer.TakerPays === 'object'
  ? offer.TakerPays.value
  : offer.TakerPays;

  var takerGetsValue = typeof offer.TakerGets === 'object'
  ? offer.TakerGets.value
  : offer.TakerGets;

  var takerPays = Amount.from_json(
    takerPaysValue + '/000/rrrrrrrrrrrrrrrrrrrrBZbvji'
  );

  var takerGets = Amount.from_json(
    takerGetsValue + '/000/rrrrrrrrrrrrrrrrrrrrBZbvji'
  );

  var fundedPays = Amount.from_json(
    fundedAmount + '/000/rrrrrrrrrrrrrrrrrrrrBZbvji'
  );

  var rate = takerPays.divide(takerGets);

  fundedPays = fundedPays.multiply(rate);

  if (fundedPays.compareTo(takerPays) < 0) {
    offer.taker_pays_funded = fundedPays.to_json().value;
  } else {
    offer.taker_pays_funded = takerPays.to_json().value;
  }

  return offer;
};

/**
 * Determine what an account is funded to offer for orderbook's
 * currency/issuer
 *
 * @param {String} account
 * @param {Function} callback
 */

OrderBook.prototype.requestFundedAmount = function(account, callback) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  assert.strictEqual(typeof callback, 'function', 'Callback is invalid');

  var self = this;

  if (self._remote.trace) {
    log.info('requesting funds', account);
  }

  function requestNativeBalance(callback) {
    self._remote.requestAccountInfo({account: account}, function(err, info) {
      if (err) {
        callback(err);
      } else {
        callback(null, String(info.account_data.Balance));
      }
    });
  };

  function requestLineBalance(callback) {
    var request = self._remote.requestAccountLines(
      {
        account: account,
        ledger: 'validated',
        peer: self._issuerGets
      }
    );

    request.request(function(err, res) {
      if (err) {
        return callback(err);
      }

      var currency = self._currencyGets.to_json();
      var balance = '0';

      for (var i=0, line; (line=res.lines[i]); i++) {
        if (line.currency === currency) {
          balance = line.balance;
          break;
        }
      }

      callback(null, balance);
    });
  };

  function computeFundedAmount(err, results) {
    if (err) {
      if (self._remote.trace) {
        log.info('failed to request funds', err);
      }
      //XXX What now?
      return callback(err);
    }

    if (self._remote.trace) {
      log.info('requested funds', account, results);
    }

    var balance;
    var fundedAmount;

    if (self._currencyGets.is_native()) {
      balance = results[0];
      fundedAmount = balance;
    } else {
      balance = results[1];
      fundedAmount = self.applyTransferRate(balance, results[0]);
    }

    callback(null, fundedAmount);
  };

  var steps = [ ];

  if (this._currencyGets.is_native()) {
    steps.push(requestNativeBalance);
  } else {
    steps.push(this.requestTransferRate.bind(this));
    steps.push(requestLineBalance);
  }

  async.parallel(steps, computeFundedAmount);
};

/**
 * Get changed balance of an affected node
 *
 * @param {Object} RippleState or AccountRoot node
 * @return {Object} { account, balance }
 */

OrderBook.prototype.getBalanceChange = function(node) {
  var result = {
    account: void(0),
    balance: void(0)
  };

  switch (node.entryType) {
    case 'AccountRoot':
      result.account = node.fields.Account;
      result.balance = node.fieldsFinal.Balance;
      break;

    case 'RippleState':
      if (node.fields.HighLimit.issuer === this._issuerGets) {
        result.account = node.fields.LowLimit.issuer;
        result.balance = node.fieldsFinal.Balance.value;
      } else if (node.fields.LowLimit.issuer === this._issuerGets) {
        // Negate balance
        result.account = node.fields.HighLimit.issuer;
        result.balance = Amount.from_json(
          node.fieldsFinal.Balance
        ).negate().to_json().value;
      }
      break;
  }

  result.isValid = !isNaN(result.balance)
                && UInt160.is_valid(result.account);

  return result;
};

/**
 * Check that affected node represents a balance change
 *
 * @param {Object} RippleState or AccountRoot node
 * @return {Boolean}
 */

OrderBook.prototype.isBalanceChange = function(node) {
  // Check balance change
  if (!(node.fields && node.fields.Balance
  && node.fieldsPrev && node.fieldsFinal
  && node.fieldsPrev.Balance && node.fieldsFinal.Balance)) {
    return false;
  }

  // Check currency
  if (this._currencyGets.is_native()) {
    return !isNaN(node.fields.Balance);
  }

  if (node.fields.Balance.currency !== this._currencyGets.to_json()) {
    return false;
  }

  // Check issuer
  if (!(node.fields.HighLimit.issuer === this._issuerGets
     || node.fields.LowLimit.issuer === this._issuerGets)) {
     return false;
   }

   return true;
};

/**
 * Update funded amounts for offers in the orderbook as new transactions are
 * streamed from server
 *
 * @param {Object} transaction
 */

OrderBook.prototype.updateFundedAmounts = function(message) {
  var self = this;

  var affectedAccounts = message.mmeta.getAffectedAccounts();

  var isOwnerAffected = affectedAccounts.some(function(account) {
    return self.hasCachedFunds(account);
  });

  if (!isOwnerAffected) {
    return;
  }

  if (!this._currencyGets.is_native() && !this._issuerTransferRate) {
    // Defer until transfer rate is requested
    if (self._remote.trace) {
      log.info('waiting for transfer rate');
    }

    this.once('transfer_rate', function() {
      self.updateFundedAmounts(message);
    });

    this.requestTransferRate();
    return;
  }

  var nodes = message.mmeta.getNodes({
    nodeType: 'ModifiedNode',
    entryType: this._currencyGets.is_native() ? 'AccountRoot' : 'RippleState'
  });

  for (var i=0; i<nodes.length; i++) {
    var node = nodes[i];

    if (!this.isBalanceChange(node)) {
      continue;
    }

    var result = this.getBalanceChange(node);

    if (result.isValid) {
      if (this.hasCachedFunds(result.account)) {
        this.updateOfferFunds(result.account, result.balance);
      }
    }
  }
};

/**
 * Update issuer's TransferRate as it changes
 *
 * @param {Object} transaction
 */

OrderBook.prototype.updateTransferRate = function(message) {
  var self = this;

  var affectedAccounts = message.mmeta.getAffectedAccounts();

  var isIssuerAffected = affectedAccounts.some(function(account) {
    return account === self._issuerGets;
  });

  if (!isIssuerAffected) {
    return;
  }

  // XXX Update transfer rate
  //
  //  var nodes = message.mmeta.getNodes({
  //    nodeType: 'ModifiedNode',
  //    entryType: 'AccountRoot'
  //  });
};

/**
 * Request orderbook entries from server
 */

OrderBook.prototype.requestOffers = function(callback) {
  var self = this;

  if (typeof callback !== 'function') {
    callback = function(){};
  }

  if (!this._shouldSubscribe) {
    return callback(new Error('Should not request offers'));
  }

  if (this._remote.trace) {
    log.info('requesting offers', this._key);
  }

  function handleOffers(res) {
    if (!Array.isArray(res.offers)) {
      // XXX What now?
      return callback(new Error('Invalid response'));
    }

    if (self._remote.trace) {
      log.info('requested offers', self._key, 'offers: ' + res.offers.length);
    }

    // Reset offers
    self._offers = [ ];

    for (var i=0, l=res.offers.length; i<l; i++) {
      var offer = res.offers[i];
      var fundedAmount;

      if (self.hasCachedFunds(offer.Account)) {
        fundedAmount = self.getCachedFunds(offer.Account);
      } else if (offer.hasOwnProperty('owner_funds')) {
        fundedAmount = self.applyTransferRate(offer.owner_funds);
        self.addCachedFunds(offer.Account, fundedAmount);
      }

      self.setFundedAmount(offer, fundedAmount);
      self.incrementOfferCount(offer.Account);
      self._offers.push(offer);
    }

    self._synchronized = true;

    self.emit('model', self._offers);

    callback(null, self._offers);
  };

  function handleError(err) {
    // XXX What now?
    if (self._remote.trace) {
      log.info('failed to request offers', self._key, err);
    }

    callback(err);
  };

  var request = this._remote.requestBookOffers(this.toJSON());
  request.once('success', handleOffers);
  request.once('error', handleError);
  request.request();

  return request;
};

/**
 * Subscribe to transactions stream
 */

OrderBook.prototype.subscribeTransactions = function(callback) {
  var self = this;

  if (typeof callback !== 'function') {
    callback = function(){};
  }

  if (!this._shouldSubscribe) {
    return callback('Should not subscribe');
  }

  if (this._remote.trace) {
    log.info('subscribing to transactions');
  }

  function handleSubscribed(res) {
    if (self._remote.trace) {
      log.info('subscribed to transactions');
    }

    self._subscribed = true;

    callback(null, res);
  };

  function handleError(err) {
    if (self._remote.trace) {
      log.info('failed to subscribe to transactions', self._key, err);
    }

    callback(err);
  };

  var request = this._remote.requestSubscribe();
  request.addStream('transactions');
  request.once('success', handleSubscribed);
  request.once('error', handleError);
  request.request();

  return request;
};

/**
 * Get offers model asynchronously.
 *
 * This function takes a callback and calls it with an array containing the
 * current set of offers in this order book.
 *
 * If the data is available immediately, the callback may be called
 * synchronously.
 *
 * @param {Function} callback
 */

OrderBook.prototype.offers =
OrderBook.prototype.getOffers = function(callback) {
  assert.strictEqual(typeof callback, 'function', 'Callback missing');

  var self = this;

  if (this._synchronized) {
    callback(null, this._offers);
  } else {
    this.once('model', function(m) {
      callback(null, m);
    });
  }

  return this;
};

/**
 * Return latest known offers
 *
 * Usually, this will just be an empty array if the order book hasn't been
 * loaded yet. But this accessor may be convenient in some circumstances.
 *
 * @return {Array} offers
 */

OrderBook.prototype.offersSync =
OrderBook.prototype.getOffersSync = function() {
  return this._offers;
};

/**
 * Insert an offer into the orderbook
 *
 * @param {Object} node
 */

OrderBook.prototype.insertOffer = function(node, fundedAmount) {
  if (this._remote.trace) {
    log.info('inserting offer', this._key, node.fields);
  }

  var nodeFields = node.fields;

  nodeFields.index = node.ledgerIndex;

  if (!isNaN(fundedAmount)) {
    this.setFundedAmount(nodeFields, fundedAmount);
    this.addCachedFunds(nodeFields.Account, fundedAmount);
  }

  var DATE_REF = {
    reference_date: new Date()
  };

  // XXX Should use Amount#from_quality
  var price = Amount.from_json(
    nodeFields.TakerPays
  ).ratio_human(node.fields.TakerGets, DATE_REF);

  for (var i=0, l=this._offers.length; i<l; i++) {
    var offer = this._offers[i];

    var priceItem = Amount.from_json(
      offer.TakerPays
    ).ratio_human(offer.TakerGets, DATE_REF);

    if (price.compareTo(priceItem) <= 0) {
      this._offers.splice(i, 0, nodeFields);
      break;
    } else if (i === (l - 1)) {
      this._offers.push(nodeFields);
    }
  }

  this.emit('offer_added', nodeFields);
};

/**
 * Modify an existing offer in the orderbook
 *
 * @param {Object} node
 * @param {Boolean} isDeletedNode
 */

OrderBook.prototype.modifyOffer = function(node, isDeletedNode) {
  if (this._remote.trace) {
    if (isDeletedNode) {
      log.info('deleting offer', this._key, node.fields);
    } else {
      log.info('modifying offer', this._key, node.fields);
    }
  }

  for (var i=0; i<this._offers.length; i++) {
    var offer = this._offers[i];
    if (offer.index === node.ledgerIndex) {
      if (isDeletedNode) {
        // Multiple offers same account?
        this._offers.splice(i, 1);
        this.emit('offer_removed', offer);
      } else {
        // TODO: This assumes no fields are deleted, which is
        // probably a safe assumption, but should be checked.
        var previousOffer = extend({}, offer);
        extend(offer, node.fieldsFinal);
        this.emit('offer_changed', previousOffer, offer);
      }
      break;
    }
  }
};

/**
 * Update funded status on offers whose account's balance has changed
 *
 * Update cached account funds
 *
 * @param {String} account address
 * @param {String|Object} offer funds
 */

OrderBook.prototype.updateOfferFunds = function(account, balance) {
  assert(UInt160.is_valid(account), 'Account is invalid');
  assert(!isNaN(balance), 'Funded amount is invalid');

  if (this._remote.trace) {
    log.info('updating offer funds', this._key, account, fundedAmount);
  }

  var fundedAmount = this.applyTransferRate(balance);

  // Update cached account funds
  this.addCachedFunds(account, fundedAmount);

  for (var i=0; i<this._offers.length; i++) {
    var offer = this._offers[i];

    if (offer.Account !== account) {
      continue;
    }

    var suffix = '/USD/rrrrrrrrrrrrrrrrrrrrBZbvji';
    var previousOffer = extend({}, offer);
    var previousFundedGets = Amount.from_json(offer.taker_gets_funded + suffix);

    offer.owner_funds = balance;
    this.setFundedAmount(offer, fundedAmount);

    var hasChangedFunds = !previousFundedGets.equals(
      Amount.from_json(offer.taker_gets_funded + suffix)
    );

    if (hasChangedFunds) {
      this.emit('offer_changed', previousOffer, offer);
      this.emit(
        'offer_funds_changed', offer,
        previousOffer.taker_gets_funded,
        offer.taker_gets_funded
      );
    }
  }
};

/**
 * Notify orderbook of a relevant transaction
 *
 * @param {Object} transaction
 * @api private
 */

OrderBook.prototype.notify = function(message) {
  var self = this;

  // Unsubscribed from OrderBook
  if (!this._subscribed) {
    return;
  }

  var affectedNodes = message.mmeta.getNodes({
    entryType: 'Offer',
    bookKey: this._key
  });

  if (affectedNodes.length < 1) {
    return;
  }

  if (this._remote.trace) {
    log.info('notifying', this._key, message.transaction.hash);
  }

  var tradeGets = Amount.from_json(
    '0' + ((Currency.from_json(this._currencyGets).is_native())
           ? ''
           : ('/' + this._currencyGets + '/' + this._issuerGets))
  );

  var tradePays = Amount.from_json(
    '0' + ((Currency.from_json(this._currencyPays).is_native())
           ? ''
           : ('/' + this._currencyPays + '/' + this._issuerPays))
  );

  function handleNode(node, callback) {
    var isDeletedNode = node.nodeType === 'DeletedNode';
    var isOfferCancel = message.transaction.TransactionType === 'OfferCancel';

    switch (node.nodeType) {
      case 'DeletedNode':
      case 'ModifiedNode':
         self.modifyOffer(node, isDeletedNode);

        // We don't want to count an OfferCancel as a trade
        if (!isOfferCancel) {
          tradeGets = tradeGets.add(node.fieldsPrev.TakerGets);
          tradePays = tradePays.add(node.fieldsPrev.TakerPays);

          if (isDeletedNode) {
            if (self.decrementOfferCount(node.fields.Account) < 1) {
              self.removeCachedFunds(node.fields.Account);
            }
          } else {
            tradeGets = tradeGets.subtract(node.fieldsFinal.TakerGets);
            tradePays = tradePays.subtract(node.fieldsFinal.TakerPays);
          }
        }
        callback();
        break;

      case 'CreatedNode':
        self.incrementOfferCount(node.fields.Account);

        var fundedAmount = message.transaction.owner_funds;

        if (!isNaN(fundedAmount)) {
          self.insertOffer(node, fundedAmount);
          return callback();
        }

        // Get the offer account's balance from server
        self.requestFundedAmount(
          node.fields.Account, function(err, fundedAmount) {
          if (err) {
            // XXX Now what?
          } else {
            self.insertOffer(node, fundedAmount);
          }
          callback();
        });
        break;
    }
  };

  async.eachSeries(affectedNodes, handleNode, function() {
    self.emit('transaction', message);
    self.emit('model', self._offers);
    if (!tradeGets.is_zero()) {
      self.emit('trade', tradePays, tradeGets);
    }
  });
};

/**
 * Get request-representation of orderbook
 *
 * @return {Object} json
 */

OrderBook.prototype.toJSON =
OrderBook.prototype.to_json = function() {
  var json = {
    taker_gets: {
      currency: this._currencyGets.to_hex()
    },
    taker_pays: {
      currency: this._currencyPays.to_hex()
    }
  };

  if (!this._currencyGets.is_native()) {
    json.taker_gets.issuer = this._issuerGets;
  }

  if (!this._currencyPays.is_native()) {
    json.taker_pays.issuer = this._issuerPays;
  }

  return json;
};

exports.OrderBook = OrderBook;

// vim:sw=2:sts=2:ts=8:et
