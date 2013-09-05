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

  this.account        = account;
  this.remote         = account._remote;
  this._timeout       = void(0);
  this._pending       = new Queue;
  this._next_sequence = void(0);
  this._cache         = { };

  //XX Fee units
  this._max_fee = this.remote.max_fee;

  this._submission_timeout = this.remote._submission_timeout;

  function remote_reconnected() {
    self.account.get_next_sequence(function(err, sequence) {
      sequence_loaded(err, sequence);
      self._resubmit(3);
    });
  }

  function remote_disconnected() {
    self.remote.once('connect', remote_reconnected);
  }

  this.remote.on('disconnect', remote_disconnected);

  function sequence_loaded(err, sequence, callback) {
    self._next_sequence = sequence;
    self.emit('sequence_loaded', sequence);
    callback && callback();
  }

  this.account.get_next_sequence(sequence_loaded);

  function adjust_fees() {
    self._pending.forEach(function(pending) {
      if (self.remote.local_fee && pending.tx_json.Fee) {
        var old_fee = pending.tx_json.Fee;
        var new_fee = self.remote.fee_tx(pending.fee_units()).to_json();
        pending.tx_json.Fee = new_fee;
        pending.emit('fee_adjusted', old_fee, new_fee);
      }
    });
  }

  this.remote.on('load_changed', adjust_fees);

  function cache_transaction(message) {
    var hash = message.transaction.hash;
    var transaction = {
      ledger_hash:   message.ledger_hash,
      ledger_index:  message.ledger_index,
      metadata:      message.meta,
      tx_json:       message.transaction
    }

    transaction.tx_json.ledger_index = transaction.ledger_index;
    transaction.tx_json.inLedger     = transaction.ledger_index;

    var pending = self._pending.get('hash', hash);

    if (pending) {
      pending.emit('success', transaction);
    } else {
      self._cache[hash] = transaction;
    }
  }

  this.account.on('transaction-outbound', cache_transaction);

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
  }

  this.remote.on('ledger_closed', update_pending_status);
};

util.inherits(TransactionManager, EventEmitter);

// request_tx presents transactions in
// a format slightly different from
// request_transaction_entry
function rewrite_transaction(tx) {
  try {
    var result = {
      ledger_index: tx.ledger_index,
      metadata: tx.meta,
      tx_json: {
        Account:          tx.Account,
        Amount:           tx.Amount,
        Destination:      tx.Destination,
        Fee:              tx.Fee,
        Flags:            tx.Flags,
        Sequence:         tx.Sequence,
        SigningPubKey:    tx.SigningPubKey,
        TransactionType:  tx.TransactionType,
        hash:             tx.hash
      }
    }
  } catch(exception) { }
  return result || { };
};

TransactionManager.prototype._resubmit = function(wait_ledgers) {
  var self = this;

  if (wait_ledgers) {
    var ledgers = Number(wait_ledgers) || 3;
    this._wait_ledgers(ledgers, function() {
      self._pending.forEach(resubmit_transaction);
    });
  } else {
    self._pending.forEach(resubmit_transaction);
  }

  function resubmit_transaction(pending) {
    if (!pending || pending.finalized) {
      // Transaction has been finalized, nothing to do
      return;
    }

    pending.emit('resubmit');

    if (!pending.hash) {
      self._request(pending);
    } else if (self._cache[pending.hash]) {
      var cached = self._cache[pending.hash];
      pending.emit('success', cached);
      delete self._cache[pending.hash];
    } else {
      // Transaction was successfully submitted, and
      // its hash discovered, but not validated
      self.remote.request_tx(pending.hash, pending_check);

      function pending_check(err, res) {
        if (self._is_not_found(err)) {
          //XX
          self._request(pending);
        } else {
          pending.emit('success', rewrite_transaction(res));
        }
      }
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
  }

  this.remote.on('ledger_closed', ledger_closed);
}

TransactionManager.prototype._request = function(tx) {
  var self   = this;
  var remote = this.remote;

  if (tx.attempts > 5) {
    tx.emit('error', new RippleError('tejAttemptsExceeded'));
    return;
  }

  var submit_request = remote.request_submit();

  if (remote.local_signing) {
    tx.sign();
    submit_request.tx_blob(tx.serialize().to_hex());
  } else {
    submit_request.secret(tx._secret);
    submit_request.build_path(tx._build_path);
    submit_request.tx_json(tx.tx_json);
  }

  function transaction_proposed(message) {
    tx.hash = message.tx_json.hash;
    tx.set_state('client_proposed');
    tx.emit('proposed', {
      tx_json:                message.tx_json,
      engine_result:          message.engine_result,
      engine_result_code:     message.engine_result_code,
      engine_result_message:  message.engine_result_message,
      // If server is honest, don't expect a final if rejected.
      rejected:               tx.isRejected(message.engine_result_code),
    });
  }

  function transaction_failed(message) {
    function transaction_requested(err, res) {
      if (self._is_not_found(err)) {
        self._resubmit(1);
      } else {
        //XX
        tx.emit('error', new RippleError(message));
      }
    }

    self.remote.request_tx(tx.hash, transaction_requested);
  }

  function transaction_retry(message) {
    switch (message.engine_result) {
      case 'terPRE_SEQ':
        self._resubmit(1);
        break;
      default:
        submission_error(new RippleError(message));
    }
  }

  function submission_error(error) {
    if (self._is_too_busy(error)) {
      self._resubmit(1);
    } else {
      //Decrement sequence
      self._next_sequence--;
      tx.set_state('remoteError');
      tx.emit('submitted', error);
      tx.emit('error', new RippleError(error));
    }
  }

  function submission_success(message) {
    if (!tx.hash) {
      tx.hash = message.tx_json.hash;
    }

    tx.emit('submitted', message);

    var engine_result = message.engine_result || '';

    switch (engine_result.slice(0, 3)) {
      case 'tec':
        tx.emit('error', message);
        break;
      case 'tes':
        transaction_proposed(message);
        break;
      case 'tef':
        //tefPAST_SEQ
        transaction_failed(message);
        break;
      case 'ter':
        transaction_retry(message);
        break;
      default:
        submission_error(message);
    }
  }

  submit_request.once('success', submission_success);
  submit_request.once('error', submission_error);
  submit_request.request();

  submit_request.timeout(this._submission_timeout, function() {
    tx.emit('timeout');
    if (self.remote._connected) {
      self._resubmit(1);
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
  if (!this._next_sequence) {
    function resubmit_transaction() {
      self.submit(tx);
    }
    this.once('sequence_loaded', resubmit_transaction);
    return;
  }

  tx.tx_json.Sequence = this._next_sequence++;
  tx.submit_index     = this.remote._ledger_current_index;
  tx.last_ledger      = void(0);
  tx.attempts         = 0;
  tx.complete();

  function finalize(message) {
    if (!tx.finalized) {
      //XX
      self._pending.removeSequence(tx.tx_json.Sequence);
      tx.finalized = true;
      tx.emit('final', message);
    }
  }

  tx.on('error', finalize);
  tx.once('success', finalize);
  tx.once('abort', function() {
    tx.emit('error', new RippleError('tejAbort', 'Transaction aborted'));
  });

  var fee = tx.tx_json.Fee;
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
