// Routines for working with an account.
//
// You should not instantiate this class yourself, instead use Remote#account.
//
// Events:
//   wallet_clean	: True, iff the wallet has been updated.
//   wallet_dirty	: True, iff the wallet needs to be updated.
//   balance		: The current stamp balance.
//   balance_proposed
//

// var network = require("./network.js");

var EventEmitter       = require('events').EventEmitter;
var util               = require('util');
var extend             = require('extend');

var Amount             = require('./amount').Amount;
var UInt160            = require('./uint160').UInt160;
var TransactionManager = require('./transactionmanager').TransactionManager;


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

  function listener_added(type, listener) {
    if (~Account.subscribe_events.indexOf(type)) {
      if (!self._subs && self._remote._connected) {
        self._remote.request_subscribe()
        .accounts(self._account_id)
        .request();
      }
      self._subs += 1;
    }
  }

  function listener_removed(type, listener) {
    if (~Account.subscribe_events.indexOf(type)) {
      self._subs -= 1;
      if (!self._subs && self._remote._connected) {
        self._remote.request_unsubscribe()
        .accounts(self._account_id)
        .request();
      }
    }
  }

  this.on('newListener', listener_added);
  this.on('removeListener', listener_removed);

  function prepare_subscribe(request) {
    if (self._account.is_valid() && self._subs) {
      request.accounts(self._account_id);
    }
  }

  this._remote.on('prepare_subscribe', prepare_subscribe);

  function handle_transaction(transaction) {
    var changed = false;

    transaction.mmeta.each(function(an) {
      var isAccountRoot = an.entryType === 'AccountRoot' 
      && an.fields.Account === self._account_id;
      if (isAccountRoot) {
        extend(self._entry, an.fieldsNew, an.fieldsFinal);
        changed = true;
      }
    });

    if (changed) {
      self.emit('entry', self._entry);
    }
  }

  this.on('transaction', handle_transaction);

  return this;
};

util.inherits(Account, EventEmitter);

/**
 * List of events that require a remote subscription to the account.
 */
Account.subscribe_events = [ 'transaction', 'entry' ];

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

Account.prototype.get_info = function(callback) {
  var callback = typeof callback === 'function' ? callback : function(){};
  var request = this._remote.request_account_info(this._account_id, callback);
  return request;
};

/**
 * Retrieve the current AccountRoot entry.
 *
 * To keep up-to-date with changes to the AccountRoot entry, subscribe to the
 * "entry" event.
 *
 * @param {function (err, entry)} callback Called with the result
 */
Account.prototype.entry = function (callback) {
  var self = this;
  var callback = typeof callback === 'function' ? callback : function(){};

  this.get_info(function account_info(err, info) {
    if (err) {
      callback(err);
    } else {
      extend(self._entry, info.account_data);
      self.emit('entry', self._entry);
      callback(null, info);
    }
  });

  return this;
};

Account.prototype.get_next_sequence = function(callback) {
  var callback = typeof callback === 'function' ? callback : function(){};

  this.get_info(function account_info(err, info) {
    if (err) {
      callback(err);
    } else {
      callback(null, info.account_data.Sequence); 
    }
  });

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

  function account_lines(err, res) {
    if (err) {
      callback(err);
    } else {
      self._lines = res.lines;
      self.emit('lines', self._lines);
      callback(null, res);
    }
  }

  this._remote.request_account_lines(this._account_id, account_lines);

  return this;
};

/**
 * Notify object of a relevant transaction.
 *
 * This is only meant to be called by the Remote class. You should never have to
 * call this yourself.
 */
Account.prototype.notifyTx = function (message) {
  // Only trigger the event if the account object is actually
  // subscribed - this prevents some weird phantom events from
  // occurring.
  if (this._subs) {
    this.emit('transaction', message);
    var account = message.transaction.Account;
    if (!account) return;
    if (account === this._account_id) {
      this.emit('transaction-outbound', message);
    } else {
      this.emit('transaction-inbound', message);
    }
  }
};

Account.prototype.submit = function(tx) {
  if (!this._tx_manager) {
    this._tx_manager = new TransactionManager(this);
  }
  this._tx_manager.submit(tx);
};

exports.Account = Account;

// vim:sw=2:sts=2:ts=8:et
