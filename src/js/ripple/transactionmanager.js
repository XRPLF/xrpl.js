var util         = require('util');
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

  this._account           = account;
  this._accountID         = account._account_id;
  this._remote            = account._remote;
  this._nextSequence      = void(0);
  this._maxFee            = this._remote.max_fee;
  this._maxAttempts       = this._remote.max_attempts;
  this._submissionTimeout = this._remote._submission_timeout;
  this._pending           = new PendingQueue();

  // Query remote server for next account sequence number
  this._loadSequence();

  function transactionReceived(res) {
    var transaction = TransactionManager.normalizeTransaction(res);
    var sequence    = transaction.tx_json.Sequence;
    var hash        = transaction.tx_json.hash;

    if (!transaction.validated) {
      return;
    }

    self._pending.addReceivedSequence(sequence);

    // ND: we need to check against all submissions IDs
    var submission = self._pending.getSubmission(hash);

    if (self._remote.trace) {
      log.info('transaction received:', transaction.tx_json);
    }

    if (submission instanceof Transaction) {

      // ND: A `success` handler will `finalize` this later
      switch (transaction.engine_result) {
        case 'tesSUCCESS':
          submission.emit('success', transaction);
          break;
        default:
          submission.emit('error', transaction);
      }

    } else {
      self._pending.addReceivedId(hash, transaction);
    }
  };

  this._account.on('transaction-outbound', transactionReceived);

  this._remote.on('load_changed', this._adjustFees.bind(this));

  function updatePendingStatus(ledger) {
    self._pending.forEach(function(pending) {
      switch (ledger.ledger_index - pending.submitIndex) {
        case 8:
          pending.emit('lost', ledger);
          break;
        case 4:
          pending.emit('missing', ledger);
          break;
      }
    });
  };

  this._remote.on('ledger_closed', updatePendingStatus);

  function remoteReconnected(callback) {
    var callback = (typeof callback === 'function') ? callback : function(){};

    if (!self._pending.length) {
      return callback();
    }

    //Load account transaction history
    var options = {
      account: self._accountID,
      ledger_index_min: -1,
      ledger_index_max: -1,
      binary: true,
      parseBinary: true,
      limit: 100,
      filter: 'outbound'
    };

    function accountTx(err, transactions) {
      if (!err && Array.isArray(transactions.transactions)) {
        transactions.transactions.forEach(transactionReceived);
      }

      self._remote.on('ledger_closed', updatePendingStatus);

      //Load next transaction sequence
      self._loadSequence(self._resubmit.bind(self));

      callback();
    };

    self._remote.requestAccountTx(options, accountTx);

    self.emit('reconnect');
  };

  function remoteDisconnected() {
    self._remote.once('connect', remoteReconnected);
    self._remote.removeListener('ledger_closed', updatePendingStatus);
  };

  this._remote.on('disconnect', remoteDisconnected);

  function saveTransaction(transaction) {
    self._remote.storage.saveTransaction(transaction.summary());
  };

  if (this._remote.storage) {
    this.on('save', saveTransaction);
  }
};

util.inherits(TransactionManager, EventEmitter);

//Normalize transactions received from account
//transaction stream and account_tx
TransactionManager.normalizeTransaction = function(tx) {
  var transaction = { };

  Object.keys(tx).forEach(function(key) {
    transaction[key] = tx[key];
  });

  if (!tx.engine_result) {
    // account_tx
    transaction = {
      engine_result:  tx.meta.TransactionResult,
      tx_json:        tx.tx,
      hash:           tx.tx.hash,
      ledger_index:   tx.tx.ledger_index,
      meta:           tx.meta,
      type:           'transaction',
      validated:      true
    };

    transaction.result = transaction.engine_result;
    transaction.result_message = transaction.engine_result_message;
  }

  if (!transaction.metadata) {
    transaction.metadata = transaction.meta;
  }

  if (!transaction.tx_json) {
    transaction.tx_json = transaction.transaction;
  }

  delete transaction.transaction;
  delete transaction.mmeta;
  delete transaction.meta;

  return transaction;
};

// Transaction fees are adjusted in real-time
TransactionManager.prototype._adjustFees = function(loadData) {
  // ND: note, that `Fee` is a component of a transactionID
  var self = this;

  if (!this._remote.local_fee) {
    return;
  }

  this._pending.forEach(function(pending) {
    var oldFee = pending.tx_json.Fee;
    var newFee = pending._computeFee();

    function maxFeeExceeded() {
      pending.once('presubmit', function() {
        pending.emit('error', 'tejMaxFeeExceeded');
      });
    };

    if (Number(newFee) > self._maxFee) {
      return maxFeeExceeded();
    }

    pending.tx_json.Fee = newFee;
    pending.emit('fee_adjusted', oldFee, newFee);

    if (self._remote.trace) {
      log.info('fee adjusted:', pending.tx_json, oldFee, newFee);
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

    if (self._remote.trace) {
      log.info('resubmit:', pending.tx_json);
    }

    if (hashCached) {
      return pending.emit('success', hashCached);
    }

    while (self._pending.hasSequence(pending.tx_json.Sequence)) {
      //Sequence number has been consumed by another transaction
      pending.tx_json.Sequence += 1;

      if (self._remote.trace) {
        log.info('incrementing sequence:', pending.tx_json);
      }
    }

    self._request(pending);
  };

  function resubmitTransactions() {
    ;(function nextTransaction(i) {
      var transaction = pending[i];

      if (!(transaction instanceof Transaction)) {
        return;
      }

      transaction.once('submitted', function(m) {
        transaction.emit('resubmitted', m);

        self._loadSequence();

        if (++i < pending.length) {
          nextTransaction(i);
        }
      });

      resubmitTransaction(transaction);
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
    if (++closes < ledgers) {
      return;
    }

    self._remote.removeListener('ledger_closed', ledgerClosed);

    callback();
  };

  this._remote.on('ledger_closed', ledgerClosed);
};

TransactionManager.prototype._request = function(tx) {
  var self   = this;
  var remote = this._remote;

  if (tx.attempts > this._maxAttempts) {
    return tx.emit('error', new RippleError('tejAttemptsExceeded'));
  }

  if (tx.attempts > 0 && !remote.local_signing) {
    var message = ''
    + 'It is not possible to resubmit transactions automatically safely without '
    + 'synthesizing the transactionID locally. See `local_signing` config option';

    return tx.emit('error', new RippleError('tejLocalSigningRequired', message));
  }

  if (tx.finalized) {
    return;
  }

  if (remote.trace) {
    log.info('submit transaction:', tx.tx_json);
  }

  function transactionProposed(message) {
    if (tx.finalized) {
      return;
    }

    // If server is honest, don't expect a final if rejected.
    message.rejected = tx.isRejected(message.engine_result_code);

    tx.emit('proposed', message);
  };

  function transactionFailed(message) {
    if (tx.finalized) {
      return;
    }

    switch (message.engine_result) {
      case 'tefPAST_SEQ':
        self._resubmit(1, tx);
        break;
      case 'tefALREADY':
        if (tx.responses === tx.submissions) {
          tx.emit('error', message);
        } else {
          submitRequest.once('success', submitted);
        }
        break;
      default:
        tx.emit('error', message);
    }
  };

  function transactionRetry(message) {
    if (tx.finalized) {
      return;
    }

    self._fillSequence(tx, function() {
      self._resubmit(1, tx);
    });
  };

  function transactionFeeClaimed(message) {
    if (tx.finalized) {
      return;
    }
  };

  function transactionFailedLocal(message) {
    if (tx.finalized) {
      return;
    }

    if (self._remote.local_fee && (message.engine_result === 'telINSUF_FEE_P')) {
      self._resubmit(2, tx);
    } else {
      submissionError(message);
    }
  };

  function submissionError(error) {
    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) {
      return;
    }

    if (TransactionManager._isTooBusy(error)) {
      self._resubmit(1, tx);
    } else {
      self._nextSequence--;
      tx.emit('error', error);
    }
  };

  function submitted(message) {
    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) {
      return;
    }

    // ND: If for some unknown reason our hash wasn't computed correctly this is
    // an extra measure.
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
        transactionProposed(message);
        break;
      case 'tec':
        transactionFeeClaimed(message);
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

  var submitRequest = remote.requestSubmit();

  submitRequest.once('error', submitted);
  submitRequest.once('success', submitted);

  function prepareSubmit() {
    if (remote.local_signing) {
      // TODO: We are serializing twice, when we could/should be feeding the
      // tx_blob to `tx.hash()` which rebuilds it to sign it.
      submitRequest.tx_blob(tx.serialize().to_hex());

      // ND: ecdsa produces a random `TxnSignature` field value, a component of
      // the hash. Attempting to identify a transaction via a hash synthesized
      // locally while using remote signing is inherently flawed.
      tx.addId(tx.hash());
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

    if (tx._server) {
      submitRequest.server = tx._server;
    }

    submitTransaction();
  };

  function requestTimeout() {
    // ND: What if the response is just slow and we get a response that
    // `submitted` above will cause to have concurrent resubmit logic streams?
    // It's simpler to just mute handlers and look out for finalized
    // `transaction` messages.

    // ND: We should audit the code for other potential multiple resubmit
    // streams. Connection/reconnection could be one? That's why it's imperative
    // that ALL transactionIDs sent over network are tracked.

    // Finalized (e.g. aborted) transactions must stop all activity
    if (tx.finalized) {
      return;
    }

    tx.emit('timeout');

    if (remote._connected) {
      if (remote.trace) {
        log.info('timeout:', tx.tx_json);
      }
      self._resubmit(3, tx);
    }
  };

  function submitTransaction() {
    if (tx.finalized) {
      return;
    }

    tx.emit('presubmit');

    submitRequest.timeout(self._submissionTimeout, requestTimeout);

    tx.submissions = submitRequest.broadcast();
    tx.attempts++;
    tx.emit('postsubmit');
  };

  tx.submitIndex = this._remote._ledger_current_index;

  if (tx.attempts === 0) {
    tx.initialSubmitIndex = tx.submitIndex;
  }

  if (!tx._setLastLedger) {
    // Honor LastLedgerSequence set by user of API. If
    // left unset by API, bump LastLedgerSequence
    tx.tx_json.LastLedgerSequence = tx.submitIndex + 8;
  }

  tx.lastLedgerSequence = tx.tx_json.LastLedgerSequence;

  if (remote.local_signing) {
    tx.sign(prepareSubmit);
  } else {
    prepareSubmit();
  }

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
 * @param {Transaction} tx
 */

TransactionManager.prototype.submit = function(tx) {
  var self = this;
  var remote = this._remote;

  // If sequence number is not yet known, defer until it is.
  if (typeof this._nextSequence !== 'number') {
    this.once('sequence_loaded', this.submit.bind(this, tx));
    return;
  }

  // Finalized (e.g. aborted) transactions must stop all activity
  if (tx.finalized) {
    return;
  }

  function cleanup(message) {
    // ND: We can just remove this `tx` by identity
    self._pending.remove(tx);
    tx.emit('final', message);
    if (remote.trace) {
      log.info('transaction finalized:', tx.tx_json, self._pending.getLength());
    }
  };

  tx.once('cleanup', cleanup);

  tx.on('save', function() {
    self.emit('save', tx);
  });

  tx.once('error', function(message) {
    tx._errorHandler(message);
  });

  tx.once('success', function(message) {
    tx._successHandler(message);
  });

  tx.once('abort', function() {
    tx.emit('error', new RippleError('tejAbort', 'Transaction aborted'));
  });

  if (typeof tx.tx_json.Sequence !== 'number') {
    tx.tx_json.Sequence = this._nextSequence++;
  }

  // Attach secret, associate transaction with a server, attach fee.
  // If the transaction can't complete, decrement sequence so that
  // subsequent transactions
  if (!tx.complete()) {
    this._nextSequence--;
    return;
  }

  tx.attempts = 0;
  tx.submissions = 0;
  tx.responses = 0;

  // ND: this is the ONLY place we put the tx into the queue. The
  // TransactionQueue queue is merely a list, so any mutations to tx._hash
  // will cause subsequent look ups (eg. inside 'transaction-outbound'
  // validated transaction clearing) to fail.
  this._pending.push(tx);
  this._request(tx);
};

exports.TransactionManager = TransactionManager;
