var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Transaction  = require('./transaction').Transaction;
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
  // ND: Do we ever clean this up?
  this._maxFee            = this._remote.max_fee;
  this._submissionTimeout = this._remote._submission_timeout;

  // Query remote server for next account
  // transaction sequence number
  this._loadSequence();

  function transactionReceived(res) {
    var transaction = TransactionManager.normalizeTransaction(res);
    var sequence    = transaction.transaction.Sequence;
    var hash        = transaction.transaction.hash;

    if (!transaction.validated) return;

    self._pending.addReceivedSequence(sequence);

    // ND: we need to check against all submissions IDs
    var submission = self._pending.getSubmission(hash);

    self._remote._trace('transactionmanager: transaction_received:', transaction.transaction);

    if (submission) {
      // ND: A `success` handler will `finalize` this later
      submission.emit('success', transaction);
    } else {
      self._pending.addReceivedId(hash, transaction);
    }
  };

  this._account.on('transaction-outbound', transactionReceived);

  function adjustFees(loadData, server) {
    // ND: note, that `Fee` is a component of a transactionID
    self._pending.forEach(function(pending) {
      var shouldAdjust = pending._server === server
      && self._remote.local_fee && pending.tx_json.Fee;

      if (shouldAdjust) {
        var oldFee = pending.tx_json.Fee;
        var newFee = server.computeFee(pending);

        pending.tx_json.Fee = newFee;
        pending.emit('fee_adjusted', oldFee, newFee);

        self._remote._trace('transactionmanager: adjusting_fees:', pending.tx_json, oldFee, newFee);
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
          self._remote._trace('transactionmanager: update_pending:', pending.tx_json);
          break;

        case 4:
          pending.setState('client_missing');
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
        self._resubmit();
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
      engine_result:  tx.meta.TransactionResult,
      transaction:    tx.tx,
      hash:           tx.tx.hash,
      ledger_index:   tx.tx.ledger_index,
      meta:           tx.meta,
      type:           'transaction',
      validated:      true
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
  var self = this;

  function submitFill(sequence, callback) {
    var fill = self._remote.transaction();
    fill.account_set(self._accountID);
    fill.tx_json.Sequence = sequence;
    fill.once('submitted', callback);
    fill.submit();
  };

  function sequenceLoaded(err, sequence) {
    if (typeof sequence !== 'number') {
      callback(new Error('Failed to fetch account transaction sequence'));
      return;
    }

    var sequenceDif = tx.tx_json.Sequence - sequence;
    var submitted = 0;

    for (var i=sequence; i<tx.tx_json.Sequence; i++) {
      submitFill(i, function() {
        if (++submitted === sequenceDif) {
          callback();
        }
      });
    }
  };

  this._loadSequence(sequenceLoaded);
};

TransactionManager.prototype._loadSequence = function(callback) {
  var self = this;

  function sequenceLoaded(err, sequence) {
    if (typeof sequence === 'number') {
      self._nextSequence = sequence;
      self.emit('sequence_loaded', sequence);
      if (typeof callback === 'function') {
        callback(err, sequence);
      }
    } else {
      setTimeout(function() {
        self._loadSequence(callback);
      }, 1000 * 3);
    }
  };

  this._account.getNextSequence(sequenceLoaded);
};

TransactionManager.prototype._resubmit = function(ledgers, pending) {
  var self = this;
  var pending = pending ? [ pending ] : this._pending;
  var ledgers = Number(ledgers) || 0;

  function resubmitTransaction(pending) {
    if (!pending || pending.finalized) {
      // Transaction has been finalized, nothing to do
      return;
    }

    var hashCached = pending.findId(self._pending._idCache);

    self._remote._trace('transactionmanager: resubmit:', pending.tx_json);

    if (hashCached) {
      return pending.emit('success', hashCached);
    }

    while (self._pending.hasSequence(pending.tx_json.Sequence)) {
      //Sequence number has been consumed by another transaction
      self._remote._trace('transactionmanager: incrementing sequence:', pending.tx_json);
      pending.tx_json.Sequence += 1;
    }

    pending.once('submitted', function(m) {
      pending.emit('resubmitted', m);
      self._loadSequence();
    });

    self._request(pending);
  };

  function resubmitTransactions() {
    ;(function nextTransaction(i) {
      var transaction = pending[i];

      if (!(transaction instanceof Transaction)) return;

      resubmitTransaction(transaction);

      transaction.once('submitted', function() {
        if (++i < pending.length) {
          nextTransaction(i);
        }
      });
    })(0);
  };

  this._waitLedgers(ledgers, resubmitTransactions);
};

TransactionManager.prototype._waitLedgers = function(ledgers, callback) {
  if (ledgers < 1) {
    return callback();
  }

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
  tx.addId(tx.hash());

  remote._trace('transactionmanager: submit:', tx.tx_json);

  function transactionProposed(message) {
    tx.setState('client_proposed');
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
    if (TransactionManager._isNoOp(tx)) {
      self._resubmit(1, tx);
    } else {
      self._fillSequence(tx, function() {
        self._resubmit(1, tx);
      });
    }
  };

  function transactionFeeClaimed(message) {
    tx.emit('error', message);
  };

  function submissionError(error) {
    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) return;

    if (TransactionManager._isTooBusy(error)) {
      self._resubmit(1, tx);
    } else {
      self._nextSequence--;
      tx.setState('remoteError');
      tx.emit('error', error);
    }
  };

  function submitted(message) {
    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) return;

    // ND: If for some unknown reason our hash wasn't computed correctly this is
    // an extra measure.
    if (message.tx_json && message.tx_json.hash) {
      tx.addId(message.tx_json.hash);
    }

    message.result = message.engine_result || '';

    remote._trace('transactionmanager: submit_response:', message);

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

  submitRequest.timeout(this._submissionTimeout, function requestTimeout() {
    // ND: What if the response is just slow and we get a response that
    // `submitted` above will cause to have concurrent resubmit logic streams?
    // It's simpler to just mute handlers and look out for finalized
    // `transaction` messages.

    // ND: We should audit the code for other potential multiple resubmit
    // streams. Connection/reconnection could be one? That's why it's imperative
    // that ALL transactionIDs sent over network are tracked.

    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) return;

    tx.emit('timeout');

    if (remote._connected) {
      remote._trace('transactionmanager: timeout:', tx.tx_json);
      self._resubmit(3, tx);
    }
  });

  submitRequest.once('error', submitted);
  submitRequest.once('success', submitted);

  if (tx._server) {
    submitRequest.server = tx._server;
  }

  submitRequest.request();

  tx.setState('client_submitted');
  tx.attempts++;

  return submitRequest;
};

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
 * Entry point for TransactionManager submission
 *
 * @param {Object} tx
 */

TransactionManager.prototype.submit = function(tx) {
  var self = this;

  // If sequence number is not yet known, defer until it is.
  if (typeof this._nextSequence === 'undefined') {
    function sequenceLoaded() {
      self.submit(tx);
    };
    this.once('sequence_loaded', sequenceLoaded);
    return;
  }

  // Finalized (e.g. aborted) transactions must stop all activity
  if (tx.finalized) return;

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
      remote._trace('transactionmanager: finalize_transaction:', tx.tx_json);
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
