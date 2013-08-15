var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var RippleError  = require('./rippleerror').RippleError;
var Queue        = require('./transactionqueue').TransactionQueue;

/**
 * @constructor TransactionManager
 * @param {Object} account
 */

function TransactionManager(account) {
  EventEmitter.call(this);

  var self            = this;

  this.account        = account;
  this.remote         = account._remote;
  this._timeout       = void(0);
  this._resubmitting  = false;
  this._pending       = new Queue;
  this._next_sequence = void(0);
  this._cache         = { };

  //XX Fee units
  this._max_fee = Number(this.remote.max_fee) || Infinity;

  function remote_disconnected() {
    function remote_reconnected() {
      self._resubmit();
    };
    self.remote.once('connect', remote_reconnected);
  };

  this.remote.on('disconnect', remote_disconnected);

  function sequence_loaded(err, sequence) {
    self._next_sequence  = sequence;
    self.emit('sequence_loaded', sequence);
  };

  this.account.get_next_sequence(sequence_loaded);

  function cache_transaction(message) {
    var transaction = {
      ledger_hash:   message.ledger_hash,
      ledger_index:  message.ledger_index,
      metadata:      message.meta,
      tx_json:       message.transaction
    }

    transaction.tx_json.ledger_index = transaction.ledger_index;
    transaction.tx_json.inLedger     = transaction.ledger_index;

    self._cache[message.transaction.Sequence] = transaction;
  }

  this.account.on('transaction', cache_transaction);
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
  } catch(exception) {
  }
  return result || { };
};

TransactionManager.prototype._resubmit = function() {
  var self = this;

  function resubmit(pending, index) {
    if (pending.finalized) {
      // Transaction has been finalized, nothing to do
      return;
    } 

    var sequence = pending.tx_json.Sequence;
    var cached   = self._cache[sequence];

    pending.emit('resubmit');

    if (cached) {
      // Transaction was received while waiting for
      // resubmission
      pending.emit('success', cached);
      delete self._cache[sequence];
    } else if (pending.hash) {
      // Transaction was successfully submitted, and
      // its hash discovered, but not validated

      function pending_check(err, res) {
        if (self._is_not_found(err)) {
          self._request(pending);
        } else {
          pending.emit('success', rewrite_transaction(res));
        }
      }

      self.remote.request_tx(pending.hash, pending_check);
    } else {
      self._request(pending);
    }
  }

  this._wait_ledgers(3, function() {
    self._pending.forEach(resubmit);
  });
}

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

  if (!tx._secret && !tx.tx_json.TxnSignature) {
    tx.emit('error', new RippleError('tejSecretUnknown', 'Missing secret'));
    return;
  }  
  
  if (!remote.trusted && !remote.local_signing) {
    tx.emit('error', new RippleError('tejServerUntrusted', 'Attempt to give secret to untrusted server'));
    return;
  }

  function finalize(message) {
    if (!tx.finalized) {
      tx.finalized = true;
      tx.emit('final', message);
      self._pending.removeSequence(tx.tx_json.Sequence);
    }
  }

  tx.once('error', finalize);
  tx.once('success', finalize);

  // Listen for 'ledger closed' events to verify
  // that the transaction is discovered in the
  // ledger before considering the transaction
  // successful
  this._detect_ledger_entry(tx);

  var submit_request = remote.request_submit();

  if (remote.local_signing) {
    tx.sign();
    submit_request.tx_blob(tx.serialize().to_hex());
  } else {
    submit_request.secret(tx._secret);
    submit_request.build_path(tx._build_path);
    submit_request.tx_json(tx.tx_json);
  }

  tx.submit_index = remote._ledger_current_index;

  function transaction_proposed(message) {
    tx.hash = message.tx_json.hash;
    tx.set_state('client_proposed');
    tx.emit('proposed', {
      tx_json:                message.tx_json,

      result:                 message.engine_result,
      engine_result:          message.engine_result,

      result_code:            message.engine_result_code,
      engine_result_code:     message.engine_result_code,

      result_message:         message.engine_result_message,
      engine_result_message:  message.engine_result_message,

      // If server is honest, don't expect a final if rejected.
      rejected:               tx.isRejected(message.engine_result_code),
    });
  }

  function transaction_failed(message) {
    if (!tx.hash) tx.hash = message.tx_json.hash;

    function transaction_requested(err, res) {
      if (self._is_not_found(err)) {
        self._resubmit();
      } else {
        tx.emit('error', new RippleError(message));
        self._pending.removeSequence(tx.tx_json.Sequence);
      }
    }

    self.remote.request_tx(tx.hash, transaction_requested);
  }

  function submission_error(err) {
    tx.set_state('remoteError');
    tx.emit('error', new RippleError(err));
  }

  function submission_success(message) {
    var engine_result = message.engine_result || '';

    tx.hash = message.tx_json.hash;

    switch (engine_result.slice(0, 3)) {
      case 'tef':
        //tefPAST_SEQ
        transaction_failed(message);
        break;
      case 'tes':
        transaction_proposed(message);
        break;
      default:
        submission_error(message);
    }
  }

  submit_request.once('success', submission_success);
  submit_request.once('error', submission_error);
  submit_request.request();

  submit_request.timeout(1000 * 10, function() {
    if (self.remote._connected) {
      self._resubmit();
    }
  });

  tx.set_state('client_submitted');
  tx.emit('submitted');

  return submit_request;
};

TransactionManager.prototype._is_not_found = function(error) {
  var not_found_re = /^(txnNotFound|transactionNotFound)$/;
  return error && typeof error === 'object'
      && error.error === 'remoteError'
      && typeof error.remote === 'object'
      && not_found_re.test(error.remote.error);
};

TransactionManager.prototype._detect_ledger_entry = function(tx) {
  var self            = this;
  var remote          = this.remote;
  var checked_ledgers = { };

  function entry_callback(err, message) {
    if (typeof message !== 'object') return;

    var ledger_hash  = message.ledger_hash;
    var ledger_index = message.ledger_index;

    if (tx.finalized || checked_ledgers[ledger_hash]) {
      // Transaction submission has already erred or
      // this ledger has already been checked for 
      // transaction
      return;
    }

    checked_ledgers[ledger_hash] = true;

    if (self._is_not_found(err)) {
      var dif = ledger_index - tx.submit_index;
      if (dif >= 8) {
        // Lost
        tx.emit('error', message);
        tx.emit('lost', message);
      } else if (dif >= 4) {
        // Missing
        tx.set_state('client_missing');
        tx.emit('missing', message);
      } else {
        // Pending
        tx.emit('pending', message);
      }
    } else {
      // Transaction was found in the ledger, 
      // consider this transaction successful
      if (message.metadata) {
        tx.set_state(message.metadata.TransactionResult);
      }
      tx.emit('success', message);
    }
  }

  function ledger_closed(message) {
    if (!tx.finalized && !checked_ledgers[message.ledger_hash]) {
      remote.request_transaction_entry(tx.hash, message.ledger_hash, entry_callback);
    }
  }

  function transaction_proposed() {
    // Check the ledger for transaction entry
    remote.addListener('ledger_closed', ledger_closed);
  }

  function transaction_finalized() {
    // Stop checking the ledger
    remote.removeListener('ledger_closed', ledger_closed);
    tx.removeListener('proposed', transaction_proposed);
  }

  tx.once('proposed', transaction_proposed);
  tx.once('final', transaction_finalized);
  tx.once('resubmit', transaction_finalized);
};

/**
 * @param {Object} tx
 */

TransactionManager.prototype.submit = function(tx) {
  // If sequence number is not yet known, defer until it is.
  var self = this;

  if (!this._next_sequence) {
    function resubmit_transaction() {
      self.submit(tx); 
    }
    this.once('sequence_loaded', resubmit_transaction);
    return;
  }

  tx.tx_json.Sequence = this._next_sequence++;
  tx.complete();

  this._pending.push(tx);

  var fee = tx.tx_json.Fee;

  if (fee === void(0) || fee <= this._max_fee) {
    this._request(tx);
  }
};

exports.TransactionManager = TransactionManager;
