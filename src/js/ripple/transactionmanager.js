var util         = require('util');
var assert       = require('assert');
var async        = require('async');
var EventEmitter = require('events').EventEmitter;
var Transaction  = require('./transaction').Transaction;
var RippleError  = require('./rippleerror').RippleError;
var PendingQueue = require('./transactionqueue').TransactionQueue;
var log          = require('./log').internal.sub('transactionmanager');

/**
 * @constructor TransactionManager
 * @param {Account} account
 */

function TransactionManager(account) {
  EventEmitter.call(this);

  var self = this;

  this._account = account;
  this._accountID = account._account_id;
  this._remote = account._remote;
  this._nextSequence = void(0);
  this._maxFee = this._remote.max_fee;
  this._maxAttempts = this._remote.max_attempts;
  this._submissionTimeout = this._remote._submission_timeout;
  this._lastLedgerOffset = this._remote._last_ledger_offset;
  this._pending = new PendingQueue();

  this._account.on('transaction-outbound', function(res) {
    self._transactionReceived(res);
  });

  this._remote.on('load_changed', function(load) {
    self._adjustFees(load);
  });

  function updatePendingStatus(ledger) {
    self._updatePendingStatus(ledger);
  };

  this._remote.on('ledger_closed', updatePendingStatus);

  function handleReconnect() {
    self._handleReconnect(function() {
      // Handle reconnect, account_tx procedure first, before
      // hooking back into ledger_closed
      self._remote.on('ledger_closed', updatePendingStatus);
    });
  };

  this._remote.on('disconnect', function() {
    self._remote.removeListener('ledger_closed', updatePendingStatus);
    self._remote.once('connect', handleReconnect);
  });

  // Query server for next account transaction sequence
  this._loadSequence();
};

util.inherits(TransactionManager, EventEmitter);

TransactionManager._isNoOp = function(transaction) {
  return (typeof transaction === 'object')
      && (typeof transaction.tx_json === 'object')
      && (transaction.tx_json.TransactionType === 'AccountSet')
      && (transaction.tx_json.Flags === 0);
};

TransactionManager._isRemoteError = function(error) {
  return (typeof error === 'object')
      && (error.error === 'remoteError')
      && (typeof error.remote === 'object');
};

TransactionManager._isNotFound = function(error) {
  return TransactionManager._isRemoteError(error)
      && /^(txnNotFound|transactionNotFound)$/.test(error.remote.error);
};

TransactionManager._isTooBusy = function(error) {
  return TransactionManager._isRemoteError(error)
      && (error.remote.error === 'tooBusy');
};

/**
 * Normalize transactions received from account transaction stream and
 * account_tx
 *
 * @param {Transaction}
 * @return {Transaction} normalized
 * @api private
 */

TransactionManager.normalizeTransaction = function(tx) {
  var transaction = { };
  var keys = Object.keys(tx);

  for (var i=0; i<keys.length; i++) {
    var k = keys[i];
    switch (k) {
      case 'transaction':
        // Account transaction stream
        transaction.tx_json = tx[k];
        break;
      case 'tx':
        // account_tx response
        transaction.engine_result = tx.meta.TransactionResult;
        transaction.result = transaction.engine_result;
        transaction.tx_json = tx[k];
        transaction.hash = tx[k].hash;
        transaction.ledger_index = tx[k].ledger_index;
        transaction.type = 'transaction';
        transaction.validated = tx.validated;
        break;
      case 'meta':
      case 'metadata':
        transaction.metadata = tx[k];
        break;
      case 'mmeta':
        // Don't copy mmeta
        break;
      default:
        transaction[k] = tx[k];
    }
  }

  return transaction;
};

/**
 * Handle received transaction from two possible sources
 *
 * + Account transaction stream (normal operation)
 * + account_tx (after reconnect)
 *
 * @param {Object} transaction
 * @api private
 */

TransactionManager.prototype._transactionReceived = function(tx) {
  var transaction = TransactionManager.normalizeTransaction(tx);

  if (!transaction.validated) {
    // Transaction has not been validated
    return;
  }

  if (transaction.tx_json.Account !== this._accountID) {
    // Received transaction's account does not match
    return;
  }

  if (this._remote.trace) {
    log.info('transaction received:', transaction.tx_json);
  }

  this._pending.addReceivedSequence(transaction.tx_json.Sequence);

  var hash = transaction.tx_json.hash;
  var submission = this._pending.getSubmission(hash);

  if (!(submission instanceof Transaction)) {
    // The received transaction does not correlate to one submitted
    return this._pending.addReceivedId(hash, transaction);
  }

  // ND: A `success` handler will `finalize` this later
  switch (transaction.engine_result) {
    case 'tesSUCCESS':
      submission.emit('success', transaction);
      break;
    default:
      submission.emit('error', transaction);
  }
};

/**
 * Adjust pending transactions' fees in real-time. This does not resubmit
 * pending transactions; they will be resubmitted periodically with an updated
 * fee (and as a consequence, a new transaction ID) if not already validated
 *
 * ND: note, that `Fee` is a component of a transactionID
 *
 * @api private
 */

TransactionManager.prototype._adjustFees = function() {
  var self = this;

  if (!this._remote.local_fee) {
    return;
  }

  function maxFeeExceeded(transaction) {
    // Don't err until attempting to resubmit
    transaction.once('presubmit', function() {
      transaction.emit('error', 'tejMaxFeeExceeded');
    });
  };

  this._pending.forEach(function(transaction) {
    if (transaction._setFixedFee) {
      return;
    }

    var oldFee = transaction.tx_json.Fee;
    var newFee = transaction._computeFee();

    if (Number(newFee) > self._maxFee) {
      // Max transaction fee exceeded, abort submission
      return maxFeeExceeded(transaction);
    }

    transaction.tx_json.Fee = newFee;
    transaction.emit('fee_adjusted', oldFee, newFee);

    if (self._remote.trace) {
      log.info('fee adjusted:', transaction.tx_json, oldFee, newFee);
    }
  });
};

/**
 * Get pending transactions
 *
 * @return {Array} pending transactions
 */

TransactionManager.prototype.getPending = function() {
  return this._pending;
};

/**
 * Legacy code. Update transaction status after excessive ledgers pass. One of
 * either "missing" or "lost"
 *
 * @param {Object} ledger data
 * @api private
 */

TransactionManager.prototype._updatePendingStatus = function(ledger) {
  assert.strictEqual(typeof ledger, 'object');
  assert.strictEqual(typeof ledger.ledger_index, 'number');

  this._pending.forEach(function(transaction) {
    switch (ledger.ledger_index - transaction.submitIndex) {
      case 4:
        transaction.emit('missing', ledger);
        break;
      case 8:
        transaction.emit('lost', ledger);
        break;
    }

    if (transaction.finalized) {
      return;
    }

    if (ledger.ledger_index > transaction.tx_json.LastLedgerSequence) {
      // Transaction must fail
      transaction.emit('error', new RippleError(
        'tejMaxLedger', 'Transaction LastLedgerSequence exceeded'));
    }
  });
};

//Fill an account transaction sequence
TransactionManager.prototype._fillSequence = function(tx, callback) {
  var self = this;

  function submitFill(sequence, callback) {
    var fill = self._remote.transaction();
    fill.account_set(self._accountID);
    fill.tx_json.Sequence = sequence;
    fill.once('submitted', callback);

    // Secrets may be set on a per-transaction basis
    if (tx._secret) {
      fill.secret(tx._secret);
    }

    fill.submit();
  };

  function sequenceLoaded(err, sequence) {
    if (typeof sequence !== 'number') {
      return callback(new Error('Failed to fetch account transaction sequence'));
    }

    var sequenceDif = tx.tx_json.Sequence - sequence;
    var submitted = 0;

    ;(function nextFill(sequence) {
      if (sequence >= tx.tx_json.Sequence) {
        return;
      }

      submitFill(sequence, function() {
        if (++submitted === sequenceDif) {
          callback();
        } else {
          nextFill(sequence + 1);
        }
      });
    })(sequence);
  };

  this._loadSequence(sequenceLoaded);
};

/**
 * Load account transaction sequence
 *
 * @param [Function] callback
 * @api private
 */

TransactionManager.prototype._loadSequence = function(callback) {
  var self = this;
  var callback = (typeof callback === 'function') ? callback : function(){};

  function sequenceLoaded(err, sequence) {
    if (err || typeof sequence !== 'number') {
      if (self._remote.trace) {
        log.info('error requesting account transaction sequence', err);
        return;
      }
    }

    self._nextSequence = sequence;
    self.emit('sequence_loaded', sequence);
    callback(err, sequence);
  };

  this._account.getNextSequence(sequenceLoaded);
};

/**
 * On reconnect, load account_tx in case a pending transaction succeeded while
 * disconnected
 *
 * @param [Function] callback
 * @api private
 */

TransactionManager.prototype._handleReconnect = function(callback) {
  var self = this;
  var callback = (typeof callback === 'function') ? callback : function(){};

  if (!this._pending.length()) {
    return callback();
  }

  function handleTransactions(err, transactions) {
    if (err || typeof transactions !== 'object') {
      if (self._remote.trace) {
        log.info('error requesting account_tx', err);
      }
      callback();
      return;
    }

    if (Array.isArray(transactions.transactions)) {
      // Treat each transaction in account transaction history as received
      transactions.transactions.forEach(self._transactionReceived, self);
    }

    callback();

    self._loadSequence(function() {
      // Resubmit pending transactions after sequence is loaded
      self._resubmit();
    });
  };

  var options = {
    account: this._accountID,
    ledger_index_min: this._pending.getMinLedger(),
    ledger_index_max: -1,
    binary: true,
    parseBinary: true,
    limit: 20
  };

  this._remote.requestAccountTx(options, handleTransactions);
};

/**
 * Wait for specified number of ledgers to pass
 *
 * @param {Number} ledgers
 * @param {Function} callback
 * @api private
 */

TransactionManager.prototype._waitLedgers = function(ledgers, callback) {
  assert.strictEqual(typeof ledgers, 'number');
  assert.strictEqual(typeof callback, 'function');

  if (ledgers < 1) {
    return callback();
  }

  var self = this;
  var closes = 0;

  function ledgerClosed() {
    if (++closes === ledgers) {
      self._remote.removeListener('ledger_closed', ledgerClosed);
      callback();
    }
  };

  this._remote.on('ledger_closed', ledgerClosed);
};

/**
 * Resubmit pending transactions. If a transaction is specified, it will be
 * resubmitted. Otherwise, all pending transactions will be resubmitted
 *
 * @param [Number] ledgers to wait before resubmitting
 * @param [Transaction] pending transactions to resubmit
 * @api private
 */

TransactionManager.prototype._resubmit = function(ledgers, pending) {
  var self = this;
  var ledgers = ledgers || 0;
  var pending = pending ? [ pending ] : this._pending;

  function resubmitTransaction(transaction, next) {
    if (!transaction || transaction.finalized) {
      // Transaction has been finalized, nothing to do
      return;
    }

    // Find ID within cache of received (validated) transaction IDs
    var received = transaction.findId(self._pending._idCache);

    if (received) {
      switch (received.engine_result) {
        case 'tesSUCCESS':
          transaction.emit('success', received);
          break;
        default:
          transaction.emit('error', received);
      }
    }

    while (self._pending.hasSequence(transaction.tx_json.Sequence)) {
      //Sequence number has been consumed by another transaction
      transaction.tx_json.Sequence += 1;

      if (self._remote.trace) {
        log.info('incrementing sequence:', transaction.tx_json);
      }
    }

    if (self._remote.trace) {
      log.info('resubmit:', transaction.tx_json);
    }

    transaction.once('submitted', function(m) {
      transaction.emit('resubmitted', m);
      next();
    });

    self._request(transaction);
  };

  this._waitLedgers(ledgers, function() {
    async.eachSeries(pending, resubmitTransaction);
  });
};

/**
 * Prepare submit request
 *
 * @param {Transaction} transaction to submit
 * @return {Request} submit request
 * @api private
 */

TransactionManager.prototype._prepareRequest = function(tx) {
  var submitRequest = this._remote.requestSubmit();

  if (this._remote.local_signing) {
    tx.sign();

    var serialized = tx.serialize();
    submitRequest.tx_blob(serialized.to_hex());

    var hash = tx.hash(null, null, serialized);
    tx.addId(hash);
  } else {
    // ND: `build_path` is completely ignored when doing local signing as
    // `Paths` is a component of the signed blob, the `tx_blob` is signed,
    // sealed and delivered, and the txn unmodified.
    // TODO: perhaps an exception should be raised if build_path is attempted
    // while local signing
    submitRequest.build_path(tx._build_path);
    submitRequest.secret(tx._secret);
    submitRequest.tx_json(tx.tx_json);
  }

  return submitRequest;
};

/**
 * Send `submit` request, handle response
 *
 * @param {Transaction} transaction to submit
 * @api private
 */

TransactionManager.prototype._request = function(tx) {
  var self = this;
  var remote = this._remote;

  if (tx.finalized) {
    return;
  }

  if (tx.attempts > this._maxAttempts) {
    tx.emit('error', new RippleError('tejAttemptsExceeded'));
    return;
  }

  if (tx.attempts > 0 && !remote.local_signing) {
    var message = 'Automatic resubmission requires local signing';
    tx.emit('error', new RippleError('tejLocalSigningRequired', message));
    return;
  }

  if (remote.trace) {
    log.info('submit transaction:', tx.tx_json);
  }

  function transactionFailed(message) {
    if (message.engine_result === 'tefPAST_SEQ') {
      // Transaction may succeed after Sequence is updated
      self._resubmit(1, tx);
    }
  };

  function transactionRetry(message) {
    // XXX This may no longer be necessary. Instead, update sequence numbers
    // after a transaction fails definitively
    self._fillSequence(tx, function() {
      self._resubmit(1, tx);
    });
  };

  function transactionFailedLocal(message) {
    if (message.engine_result === 'telINSUF_FEE_P') {
      // Transaction may succeed after Fee is updated
      self._resubmit(1, tx);
    }
  };

  function submissionError(error) {
    // Either a tem-class error or generic server error such as tooBusy. This
    // should be a definitive failure
    if (TransactionManager._isTooBusy(error)) {
      self._resubmit(1, tx);
    } else {
      self._nextSequence--;
      tx.emit('error', error);
    }
  };

  function submitted(message) {
    if (tx.finalized) {
      return;
    }

    // ND: If for some unknown reason our hash wasn't computed correctly this
    // is an extra measure.
    if (message.tx_json && message.tx_json.hash) {
      tx.addId(message.tx_json.hash);
    }

    message.result = message.engine_result || '';

    tx.result = message;
    tx.responses += 1;

    if (remote.trace) {
      log.info('submit response:', message);
    }

    tx.emit('submitted', message);

    switch (message.result.slice(0, 3)) {
      case 'tes':
        tx.emit('proposed', message);
        break;
      case 'tec':
        break;
      case 'ter':
        transactionRetry(message);
        break;
      case 'tef':
        transactionFailed(message);
        break;
      case 'tel':
        transactionFailedLocal(message);
        break;
      default:
        // tem
        submissionError(message);
    }
  };

  function requestTimeout() {
    // ND: What if the response is just slow and we get a response that
    // `submitted` above will cause to have concurrent resubmit logic streams?
    // It's simpler to just mute handlers and look out for finalized
    // `transaction` messages.
    if (tx.finalized) {
      return;
    }

    tx.emit('timeout');

    if (remote.isConnected()) {
      if (remote.trace) {
        log.info('timeout:', tx.tx_json);
      }
      self._resubmit(1, tx);
    }
  };

  tx.submitIndex = this._remote._ledger_current_index;

  if (tx.attempts === 0) {
    tx.initialSubmitIndex = tx.submitIndex;
  }

  if (!tx._setLastLedger) {
    // Honor LastLedgerSequence set with tx.lastLedger()
    tx.tx_json.LastLedgerSequence = tx.initialSubmitIndex
    + this._lastLedgerOffset;
  }

  tx.lastLedgerSequence = tx.tx_json.LastLedgerSequence;

  if (remote.local_signing) {
    tx.sign();
  }

  var submitRequest = this._prepareRequest(tx);
  submitRequest.once('error', submitted);
  submitRequest.once('success', submitted);

  tx.emit('presubmit');

  submitRequest.broadcast().request();
  tx.attempts++;

  tx.emit('postsubmit');

  //XXX
  submitRequest.timeout(self._submissionTimeout, requestTimeout);

  return submitRequest;
};

/**
 * Entry point for TransactionManager submission
 *
 * @param {Transaction} tx
 */

TransactionManager.prototype.submit = function(tx) {
  var self = this;
  var remote = this._remote;

  if (typeof this._nextSequence !== 'number') {
    // If sequence number is not yet known, defer until it is.
    this.once('sequence_loaded', function() {
      self.submit(tx);
    });
    return;
  }

  if (tx.finalized) {
    // Finalized transactions must stop all activity
    return;
  }

  if (typeof tx.tx_json.Sequence !== 'number') {
    // Honor manually-set sequences
    tx.tx_json.Sequence = this._nextSequence++;
  }

  tx.once('cleanup', function() {
    self.getPending().remove(tx);
  });

  if (!tx.complete()) {
    this._nextSequence--;
    return;
  }

  // ND: this is the ONLY place we put the tx into the queue. The
  // TransactionQueue queue is merely a list, so any mutations to tx._hash
  // will cause subsequent look ups (eg. inside 'transaction-outbound'
  // validated transaction clearing) to fail.
  this._pending.push(tx);
  this._request(tx);
};

exports.TransactionManager = TransactionManager;
