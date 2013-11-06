var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var RippleError  = require('./rippleerror').RippleError;
var Queue        = require('./transactionqueue').TransactionQueue;
var Amount       = require('./amount');

/**
 * @constructor TransactionManager
 * @param {Object} account
 */

function TransactionManager(account) {
  EventEmitter.call(this);

  var self = this;

  this.account             = account;
  this.remote              = account._remote;
  this._timeout            = void(0);
  this._pending            = new Queue;
  this._next_sequence      = void(0);
  this._cache              = { };
  this._sequence_cache     = { };
  this._max_fee            = this.remote.max_fee;
  this._submission_timeout = this.remote._submission_timeout;

  // Query remote server for next account
  // transaction sequence number
  this._load_sequence();

  function cache_transaction(transaction) {
    var transaction = TransactionManager.normalize_transaction(transaction);
    var sequence = transaction.tx_json.Sequence;
    var hash = transaction.hash;

    self._sequence_cache[sequence] = transaction;

    var pending = self._pending.get('hash', hash);

    if (pending) {
      pending.emit('success', transaction);
    } else {
      self._cache[hash] = transaction;
    }
  };

  this.account.on('transaction-outbound', cache_transaction);

  function adjust_fees() {
    self._pending.forEach(function(pending) {
      if (self.remote.local_fee && pending.tx_json.Fee) {
        var old_fee = pending.tx_json.Fee;
        var new_fee = self.remote.fee_tx(pending.fee_units()).to_json();
        pending.tx_json.Fee = new_fee;
        pending.emit('fee_adjusted', old_fee, new_fee);
      }
    });
  };

  this.remote.on('load_changed', adjust_fees);

  function update_pending_status(ledger) {
    self._pending.forEach(function(pending) {
      pending.last_ledger = ledger;
      switch (ledger.ledger_index - pending.submit_index) {
        case 8:
          pending.emit('lost', ledger);
          pending.emit('error', new RippleError('tejLost', 'Transaction lost'));
          break;
        case 4:
          pending.set_state('client_missing');
          pending.emit('missing', ledger);
          break;
      }
    });
  };

  this.remote.on('ledger_closed', update_pending_status);

  function remote_reconnected() {
    //Load account transaction history
    var options = {
      account: self.account._account_id,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 10
    }

    self.remote.request_account_tx(options, function(err, transactions) {
      if (!err && transactions.transactions) {
        transactions.transactions.forEach(cache_transaction);
      }
      self.remote.on('ledger_closed', update_pending_status);
    });

    //Load next transaction sequence
    self._load_sequence(function() {
      self._resubmit(3);
    });
  };

  function remote_disconnected() {
    self.remote.once('connect', remote_reconnected);
    self.remote.removeListener('ledger_closed', update_pending_status);
  };

  this.remote.on('disconnect', remote_disconnected);
};

util.inherits(TransactionManager, EventEmitter);

//Normalize transactions received from account
//transaction stream and account_tx
TransactionManager.normalize_transaction = function(tx) {
  if (tx.tx) {
    tx.transaction = tx.tx;
  }

  var hash        = tx.transaction.hash;
  var sequence    = tx.transaction.Sequence;

  var transaction = {
    ledger_hash:   tx.ledger_hash || tx.transaction.ledger_hash,
    ledger_index:  tx.ledger_index || tx.transaction.ledger_index,
    metadata:      tx.meta,
    tx_json:       tx.transaction
  }

  transaction.hash = hash;
  transaction.tx_json.ledger_index = transaction.ledger_index;
  transaction.tx_json.inLedger = transaction.ledger_index;

  return transaction;
};

//Fill an account transaction sequence
TransactionManager.prototype._fill_sequence = function(tx, callback) {
  var fill = this.remote.transaction();
  fill.account_set(this.account._account_id);
  fill.tx_json.Sequence = tx.tx_json.Sequence - 1;
  fill.submit(callback);
};

TransactionManager.prototype._load_sequence = function(callback) {
  var self = this;

  function sequence_loaded(err, sequence) {
    if (typeof sequence === 'number') {
      self._next_sequence = sequence;
      self.emit('sequence_loaded', sequence);
    } else {
      return setTimeout(function() {
        self._load_sequence(callback);
      }, 1000 * 3);
    }
    if (typeof callback === 'function') {
      callback(err, sequence);
    }
  };

  this.account.get_next_sequence(sequence_loaded);
};

TransactionManager.prototype._resubmit = function(wait_ledgers, pending) {
  var self = this;
  var pending = pending ? [ pending ] : this._pending;

  if (wait_ledgers) {
    var ledgers = Number(wait_ledgers) || 3;
    this._wait_ledgers(ledgers, function() {
      pending.forEach(resubmit_transaction);
    });
  } else {
    pending.forEach(resubmit_transaction);
  }

  function resubmit_transaction(pending) {
    if (!pending || pending.finalized) {
      // Transaction has been finalized, nothing to do
      return;
    }

    var hash_cached = self._cache[pending.hash];
    var seq_cached  = self._sequence_cache[pending.tx_json.Sequence];

    if (hash_cached) {
      pending.emit('success', hash_cached);
    } else if (seq_cached) {
      //Sequence number has been consumed by
      //another transaction
      pending.tx_json.Sequence++;
      pending.once('submitted', function() {
        self._load_sequence();
      });
      self._request(pending);
    } else {
      self._request(pending);
    }
  }
};

TransactionManager.prototype._wait_ledgers = function(ledgers, callback) {
  var self = this;
  var closes = 0;

  function ledger_closed() {
    if (++closes === ledgers) {
      callback();
      self.remote.removeListener('ledger_closed', ledger_closed);
    }
  };

  this.remote.on('ledger_closed', ledger_closed);
};

TransactionManager.prototype._request = function(tx) {
  var self   = this;
  var remote = this.remote;

  if (tx.attempts > 10) {
    tx.emit('error', new RippleError('tejAttemptsExceeded'));
    return;
  }

  var submit_request = remote.request_submit();

  submit_request.build_path(tx._build_path);

  if (remote.local_signing) {
    tx.sign();
    submit_request.tx_blob(tx.serialize().to_hex());
  } else {
    submit_request.secret(tx._secret);
    submit_request.tx_json(tx.tx_json);
  }

  function transaction_proposed(message) {
    tx.set_state('client_proposed');
    // If server is honest, don't expect a final if rejected.
    message.rejected = tx.isRejected(message.engine_result_code)
    tx.emit('proposed', message);
  };

  function transaction_failed(message) {
    switch (message.engine_result) {
      case 'tefPAST_SEQ':
        self._resubmit(2, tx);
      break;
      default:
        submission_error(message);
    }
  };

  function transaction_retry(message) {
    switch (message.engine_result) {
      case 'terPRE_SEQ':
        self._fill_sequence(tx, function() {
          self._resubmit(2, tx);
        });
        break;
      default:
        self._resubmit(1, tx);
    }
  };

  function submission_error(error) {
    if (self._is_too_busy(error)) {
      self._resubmit(1, tx);
    } else {
      self._next_sequence--;
      tx.set_state('remoteError');
      tx.emit('submitted', error);
      tx.emit('error', error);
    }
  };

  function submission_success(message) {
    if (message.tx_json.hash) {
      tx.hash = message.tx_json.hash;
    }

    message.result = message.engine_result || '';

    tx.emit('submitted', message);

    switch (message.result.slice(0, 3)) {
      case 'tec':
        tx.emit('error', message);
        break;
      case 'tes':
        transaction_proposed(message);
        break;
      case 'tef':
        transaction_failed(message);
        break;
      case 'ter':
        transaction_retry(message);
        break;
      default:
        submission_error(message);
    }
  };

  submit_request.once('success', submission_success);
  submit_request.once('error', submission_error);
  submit_request.request();

  submit_request.timeout(this._submission_timeout, function() {
    tx.emit('timeout');
    if (self.remote._connected) {
      self._resubmit(1, tx);
    }
  });

  tx.set_state('client_submitted');
  tx.attempts++;

  return submit_request;
};

TransactionManager.prototype._is_remote_error = function(error) {
  return error && typeof error === 'object'
      && error.error === 'remoteError'
      && typeof error.remote === 'object'
};

TransactionManager.prototype._is_not_found = function(error) {
  return this._is_remote_error(error) && /^(txnNotFound|transactionNotFound)$/.test(error.remote.error);
};

TransactionManager.prototype._is_too_busy = function(error) {
  return this._is_remote_error(error) && error.remote.error === 'tooBusy';
};

/**
 * Entry point for TransactionManager submission
 *
 * @param {Object} tx
 */

TransactionManager.prototype.submit = function(tx) {
  var self = this;

  // If sequence number is not yet known, defer until it is.
  if (typeof this._next_sequence === 'undefined') {
    this.once('sequence_loaded', function() {
      self.submit(tx);
    });
    return;
  }

  if (typeof tx.tx_json.Sequence !== 'number') {
    tx.tx_json.Sequence = this._next_sequence++;
  }

  tx.submit_index = this.remote._ledger_current_index;
  tx.last_ledger  = void(0);
  tx.attempts     = 0;
  tx.complete();

  function finalize(message) {
    if (!tx.finalized) {
      self._pending.removeHash(tx.hash);
      tx.finalized = true;
      tx.emit('final', message);
    }
  };

  tx.on('error', finalize);
  tx.once('success', finalize);
  tx.once('abort', function() {
    tx.emit('error', new RippleError('tejAbort', 'Transaction aborted'));
  });

  var fee = Number(tx.tx_json.Fee);
  var remote = this.remote;

  if (!tx._secret && !tx.tx_json.TxnSignature) {
    tx.emit('error', new RippleError('tejSecretUnknown', 'Missing secret'));
  } else if (!remote.trusted && !remote.local_signing) {
    tx.emit('error', new RippleError('tejServerUntrusted', 'Attempt to give secret to untrusted server'));
  } else if (fee && fee > this._max_fee) {
    tx.emit('error', new RippleError('tejMaxFeeExceeded', 'Max fee exceeded'));
  } else {
    this._pending.push(tx);
    this._request(tx);
  }
};

exports.TransactionManager = TransactionManager;
