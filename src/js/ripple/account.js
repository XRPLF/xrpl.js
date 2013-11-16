// Routines for working with an account.
//
// You should not instantiate this class yourself, instead use Remote#account.
//
// Events:
//   wallet_clean :  True, iff the wallet has been updated.
//   wallet_dirty :  True, iff the wallet needs to be updated.
//   balance:        The current stamp balance.
//   balance_proposed
//

// var network = require("./network.js");

var EventEmitter       = require('events').EventEmitter;
var util               = require('util');
var extend             = require('extend');

var Amount             = require('./amount').Amount;
var UInt160            = require('./uint160').UInt160;
var TransactionManager = require('./transactionmanager').TransactionManager;

/**
 * @constructor Account
 * @param {Remote} remote
 * @param {String} account
 */

function Account(remote, account) {
  EventEmitter.call(this);

  var self = this;

  this._remote     = remote;
  this._account    = UInt160.from_json(account);
  this._account_id = this._account.to_json();
  this._subs       = 0;

  // Ledger entry object
  // Important: This must never be overwritten, only extend()-ed
  this._entry = { };

  function listenerAdded(type, listener) {
    if (~Account.subscribeEvents.indexOf(type)) {
      if (!self._subs && self._remote._connected) {
        self._remote.request_subscribe()
        .add_account(self._account_id)
        .broadcast();
      }
      self._subs += 1;
    }
  };

  this.on('newListener', listenerAdded);

  function listenerRemoved(type, listener) {
    if (~Account.subscribeEvents.indexOf(type)) {
      self._subs -= 1;
      if (!self._subs && self._remote._connected) {
        self._remote.request_unsubscribe()
        .add_account(self._account_id)
        .broadcast();
      }
    }
  };

  this.on('removeListener', listenerRemoved);

  function attachAccount(request) {
    if (self._account.is_valid() && self._subs) {
      request.add_account(self._account_id);
    }
  };

  this._remote.on('prepare_subscribe', attachAccount);

  function handleTransaction(transaction) {
    var changed = false;

    transaction.mmeta.each(function(an) {
      var isAccountRoot = (an.entryType === 'AccountRoot') && an.fields.Account === self._account_id;
      if (isAccountRoot) {
        extend(self._entry, an.fieldsNew, an.fieldsFinal);
        changed = true;
      }
    });

    if (changed) {
      self.emit('entry', self._entry);
    }
  };

  this.on('transaction', handleTransaction);

  this._transactionManager = new TransactionManager(this);

  return this;
};

util.inherits(Account, EventEmitter);

/**
 * List of events that require a remote subscription to the account.
 */

Account.subscribeEvents = [ 'transaction', 'entry' ];

Account.prototype.to_json = function () {
  return this._account.to_json();
};

/**
 * Whether the AccountId is valid.
 *
 * Note: This does not tell you whether the account exists in the ledger.
 */

Account.prototype.is_valid = function () {
  return this._account.is_valid();
};

/**
 * Request account info
 *
 * @param {Function} callback
 */

Account.prototype.getInfo = function(callback) {
  return this._remote.request_account_info(this._account_id, callback);
};

/**
 * Retrieve the current AccountRoot entry.
 *
 * To keep up-to-date with changes to the AccountRoot entry, subscribe to the
 * "entry" event.
 *
 * @param {Function} callback
 */

Account.prototype.entry = function (callback) {
  var self = this;
  var callback = typeof callback === 'function' ? callback : function(){};

  function accountInfo(err, info) {
    if (err) {
      callback(err);
    } else {
      extend(self._entry, info.account_data);
      self.emit('entry', self._entry);
      callback(null, info);
    }
  };

  this.getInfo(accountInfo);

  return this;
};

Account.prototype.getNextSequence = function(callback) {
  var callback = typeof callback === 'function' ? callback : function(){};

  function accountInfo(err, info) {
    if (err) {
      callback(err);
    } else {
      callback(null, info.account_data.Sequence);
    }
  };

  this.getInfo(accountInfo);

  return this;
};

/**
 * Retrieve this account's Ripple trust lines.
 *
 * To keep up-to-date with changes to the AccountRoot entry, subscribe to the
 * "lines" event. (Not yet implemented.)
 *
 * @param {function (err, lines)} callback Called with the result
 */

Account.prototype.lines = function (callback) {
  var self = this;
  var callback = typeof callback === 'function' ? callback : function(){};

  function accountLines(err, res) {
    if (err) {
      callback(err);
    } else {
      self._lines = res.lines;
      self.emit('lines', self._lines);
      callback(null, res);
    }
  }

  this._remote.requestAccountLines(this._account_id, accountLines);

  return this;
};

/**
 * Notify object of a relevant transaction.
 *
 * This is only meant to be called by the Remote class. You should never have to
 * call this yourself.
 *
 * @param {Object} message
 */

Account.prototype.notify =
Account.prototype.notifyTx = function (transaction) {
  // Only trigger the event if the account object is actually
  // subscribed - this prevents some weird phantom events from
  // occurring.
  if (this._subs) {
    this.emit('transaction', transaction);
    var account = transaction.transaction.Account;
    if (!account) return;
    if (account === this._account_id) {
      this.emit('transaction-outbound', transaction);
    } else {
      this.emit('transaction-inbound', transaction);
    }
  }
};

/**
 * Submit a transaction to an account's
 * transaction manager
 *
 * @param {Transaction} transaction
 */

Account.prototype.submit = function(transaction) {
  this._transactionManager.submit(transaction);
};

exports.Account = Account;

// vim:sw=2:sts=2:ts=8:et
