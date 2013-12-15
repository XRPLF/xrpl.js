var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var RippleError  = require('./rippleerror').RippleError;
var PendingQueue = require('./transactionqueue').TransactionQueue;

/**
 * @constructor TransactionManager
 * @param {Account} account
 */

function TransactionManager(account) {
  EventEmitter.call(this);

  var self = this;

  this._account           = account;
  this._accountID         = account._account_id;
  this._remote            = account._remote;
  this._pending           = new PendingQueue;
  this._nextSequence      = void(0);
  this._cache             = { };
  this._sequenceCache     = { };
  this._maxFee            = this._remote.max_fee;
  this._submissionTimeout = this._remote._submission_timeout;

  // Query remote server for next account
  // transaction sequence number
  this._loadSequence();

  function transactionReceived(res) {
    var transaction = TransactionManager.normalizeTransaction(res);
    var sequence    = transaction.transaction.Sequence;
    var hash        = transaction.transaction.hash;

    self._sequenceCache[sequence] = transaction;

    // ND: we need to check against all submissions ids
    var pending = self._pending.getBySubmissions(hash);
    // var pending = self._pending.get('_hash', hash);

    self._remote._trace('transactionmanager: transaction_received: %s', transaction.transaction);

    if (pending) {
      // ND: A `success` handler will `finalize` this later
      pending.emit('success', transaction);
    } else {
      self._cache[hash] = transaction;
    }
  };

  this._account.on('transaction-outbound', transactionReceived);

  function adjustFees() {
    // ND: note, that `Fee` is a component of a transactionID
    self._pending.forEach(function(pending) {
      if (self._remote.local_fee && pending.tx_json.Fee) {
        var oldFee = pending.tx_json.Fee;
        var newFee = self._remote.feeTx(pending.fee_units()).to_json();
        pending.tx_json.Fee = newFee;
        pending.emit('fee_adjusted', oldFee, newFee);
        self._remote._trace('transactionmanager: adjusting_fees: %s', pending, oldFee, newFee);
      }
    });
  };

  this._remote.on('load_changed', adjustFees);

  function updatePendingStatus(ledger) {
    self._pending.forEach(function(pending) {
      pending.lastLedger = ledger;
      switch (ledger.ledger_index - pending.submitIndex) {
        case 8:
          pending.emit('lost', ledger);
          pending.emit('error', new RippleError('tejLost', 'Transaction lost'));
          self._remote._trace('transactionmanager: update_pending: %s', pending.tx_json);
          break;
        case 4:
          pending.set_state('client_missing');
          pending.emit('missing', ledger);
          break;
      }
    });
  };

  this._remote.on('ledger_closed', updatePendingStatus);

  function remoteReconnected() {
    //Load account transaction history
    var options = {
      account: self._accountID,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 10
    }

    self._remote.requestAccountTx(options, function(err, transactions) {
      if (!err && transactions.transactions) {
        transactions.transactions.forEach(transactionReceived);
      }

      self._remote.on('ledger_closed', updatePendingStatus);

      //Load next transaction sequence
      self._loadSequence(function sequenceLoaded() {
        self._resubmit(3);
      });
    });

    self.emit('reconnect');
  };

  function remoteDisconnected() {
    self._remote.once('connect', remoteReconnected);
    self._remote.removeListener('ledger_closed', updatePendingStatus);
  };

  this._remote.on('disconnect', remoteDisconnected);
};

util.inherits(TransactionManager, EventEmitter);

//Normalize transactions received from account
//transaction stream and account_tx
TransactionManager.normalizeTransaction = function(tx) {
  var transaction = tx;

  if (!tx.engine_result) {
    // account_tx
    transaction = {
      engine_result:          tx.meta.TransactionResult,
      transaction:            tx.tx,
      hash:                   tx.tx.hash,
      ledger_index:           tx.tx.ledger_index,
      meta:                   tx.meta,
      type:                   'transaction',
      validated:              true
    }
    transaction.result         = transaction.engine_result;
    transaction.result_message = transaction.engine_result_message;
  }

  transaction.metadata = transaction.meta;

  if (!transaction.tx_json) {
    transaction.tx_json = transaction.transaction;
  }

  return transaction;
};

//Fill an account transaction sequence
TransactionManager.prototype._fillSequence = function(tx, callback) {
  var fill = this._remote.transaction();
  fill.account_set(this._accountID);
  fill.tx_json.Sequence = tx.tx_json.Sequence - 1;
  fill.submit(callback);
};

TransactionManager.prototype._loadSequence = function(callback) {
  var self = this;

  function sequenceLoaded(err, sequence) {
    if (typeof sequence === 'number') {
      self._nextSequence = sequence;
      self.emit('sequence_loaded', sequence);
    } else {
      return setTimeout(function() {
        self._loadSequence(callback);
      }, 1000 * 3);
    }
    if (typeof callback === 'function') {
      callback(err, sequence);
    }
  };

  this._account.getNextSequence(sequenceLoaded);
};

TransactionManager.prototype._resubmit = function(waitLedgers, pending) {
  var self = this;
  var pending = pending ? [ pending ] : this._pending;

  if (waitLedgers) {
    var ledgers = Number(waitLedgers) || 3;
    this._waitLedgers(ledgers, function() {
      pending.forEach(resubmitTransaction);
    });
  } else {
    pending.forEach(resubmitTransaction);
  }

  function resubmitTransaction(pending) {
    if (!pending || pending.finalized) {
      // Transaction has been finalized, nothing to do
      return;
    }

    var hashCached = self._cache[pending._hash];
    self._remote._trace('transactionmanager: resubmit: %s', pending.tx_json);

    if (hashCached) {
      pending.emit('success', hashCached);
    } else {
      while (self._sequenceCache[pending.tx_json.Sequence]) {
        //Sequence number has been consumed by another transaction
        self._remote._trace('transactionmanager: incrementing sequence: %s', pending.tx_json);
        pending.tx_json.Sequence += 1;
      }

      pending.once('submitted', function() {
        pending.emit('resubmitted');
        self._loadSequence();
      });

      self._request(pending);
    }
  }
};

TransactionManager.prototype._waitLedgers = function(ledgers, callback) {
  var self = this;
  var closes = 0;

  function ledgerClosed() {
    if (++closes === ledgers) {
      callback();
      self._remote.removeListener('ledger_closed', ledgerClosed);
    }
  };

  this._remote.on('ledger_closed', ledgerClosed);
};

TransactionManager.prototype._request = function(tx) {
  var self   = this;
  var remote = this._remote;

  if (tx.attempts > 10) {
    tx.emit('error', new RippleError('tejAttemptsExceeded'));
    return;
  }

  var submitRequest = remote.requestSubmit();

  submitRequest.build_path(tx._build_path);

  if (remote.local_signing) {
    tx.sign();
    submitRequest.tx_blob(tx.serialize().to_hex());
  } else {
    submitRequest.secret(tx._secret);
    submitRequest.tx_json(tx.tx_json);
  }

  // ND: We could consider sharing the work with tx_blob when doing
  // local_signing

  tx.addSubmittedTxnID(tx.hash());
  // tx._hash = tx.hash();

  remote._trace('transactionmanager: submit: %s', tx.tx_json);

  function transactionProposed(message) {
    tx.set_state('client_proposed');
    // If server is honest, don't expect a final if rejected.
    message.rejected = tx.isRejected(message.engine_result_code)
    tx.emit('proposed', message);
  };

  function transactionFailed(message) {
    switch (message.engine_result) {
      case 'tefPAST_SEQ':
        self._resubmit(3, tx);
      break;
      default:
        tx.emit('error', message);
    }
  };

  function transactionRetry(message) {
    switch (message.engine_result) {
      case 'terPRE_SEQ':
        self._fillSequence(tx, function() {
          self._resubmit(1, tx);
        });
        break;
      default:
        self._resubmit(1, tx);
    }
  };

  function transactionFeeClaimed(message) {
    tx.emit('error', message);
  };

  function submissionError(error) {
    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) return;

    if (self._is_too_busy(error)) {
      self._resubmit(1, tx);
    } else {
      self._nextSequence--;
      tx.set_state('remoteError');
      tx.emit('error', error);
    }
  };

  function submitted(message) {
    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) return;


    // ND: If for some unknown reason our hash wasn't computed correctly this is
    // an extra measure.
    if (message.tx_json && message.tx_json.hash) {
      tx.addSubmittedTxnID(message.tx_json.hash);
    }

    message.result = message.engine_result || '';

    remote._trace('transactionmanager: submit_response: %s', message);

    tx.emit('submitted', message);

    switch (message.result.slice(0, 3)) {
      case 'tec':
        transactionFeeClaimed(message);
        break;
      case 'tes':
        transactionProposed(message);
        break;
      case 'tef':
        transactionFailed(message);
        break;
      case 'ter':
        transactionRetry(message);
        break;
      default:
        submissionError(message);
    }
  };

  submitRequest.timeout(this._submissionTimeout, function() {
    // ND: What if the response is just slow and we get a response that
    // `submitted` above will cause to have concurrent resubmit logic streams?
    // It's simpler to just mute handlers and look out for finalized
    // `transaction` messages.

    // ND: We should audit the code for other potential multiple resubmit
    // streams. Connection/reconnection could be one? That's why it's imperative
    // that ALL transactionIDs sent over network are tracked.
    submitRequest.removeAllListeners();

    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) return;

    tx.emit('timeout');
    if (remote._connected) {
      remote._trace('transactionmanager: timeout: %s', tx.tx_json);
      self._resubmit(3, tx);
    }
  });

  submitRequest.once('error', submitted);
  submitRequest.once('success', submitted);
  submitRequest.request();

  tx.set_state('client_submitted');
  tx.attempts++;

  return submitRequest;
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
  if (typeof this._nextSequence === 'undefined') {
    function sequenceLoaded() {
      // Finalized (e.g. aborted) transactions must stop all activity
      if (tx.finalized) return;

      self.submit(tx);
    };
    this.once('sequence_loaded', sequenceLoaded);
    return;
  }

  if (typeof tx.tx_json.Sequence !== 'number') {
    tx.tx_json.Sequence = this._nextSequence++;
  }

  tx.submitIndex = this._remote._ledger_current_index;
  tx.lastLedger  = void(0);
  tx.attempts    = 0;
  tx.complete();

  function finalize(message) {
    if (!tx.finalized) {
      // ND: We can just remove this `tx` by identity
      self._pending.remove(tx);
      // self._pending.removeHash(tx._hash);
      remote._trace('transactionmanager: finalize_transaction: %s', tx.tx_json);
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
  var remote = this._remote;

  if (!tx._secret && !tx.tx_json.TxnSignature) {
    tx.emit('error', new RippleError('tejSecretUnknown', 'Missing secret'));
  } else if (!remote.trusted && !remote.local_signing) {
    tx.emit('error', new RippleError('tejServerUntrusted', 'Attempt to give secret to untrusted server'));
  } else if (fee && fee > this._maxFee) {
    tx.emit('error', new RippleError('tejMaxFeeExceeded', 'Max fee exceeded'));
  } else {
    // ND: this is the ONLY place we put the tx into the queue. The
    // TransactionQueue queue is merely a list, so any mutations to tx._hash
    // will cause subsequent look ups (eg. inside 'transaction-outbound'
    // validated transaction clearing) to fail.
    this._pending.push(tx);
    this._request(tx);
  }
};

exports.TransactionManager = TransactionManager;
