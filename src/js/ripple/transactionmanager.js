var EventEmitter = require('events').EventEmitter;
var util         = require('util');

/**
 * @constructor TransactionManager
 * @param {Object} account
 */

function TransactionManager(account) {
  EventEmitter.call(this);

  var self             = this;

  this.account         = account;
  this.remote          = account._remote;
  this._timeout        = void(0);
  this._next_sequence  = void(0);
  this._config         = { max_fee: self.remote.max_fee };

  function sequence_loaded(err, sequence) {
    self._next_sequence = sequence;
    self.emit('sequence_loaded', sequence);
  }

  account.get_next_sequence(sequence_loaded);
}

util.inherits(TransactionManager, EventEmitter);

/**
 * @param {Object} tx
 */

//TransactionManager.prototype.update = function(tx) {
//  this._next_sequence_number = Math.max(tx.meta.account_next_seq, this._next_sequence_number);
//  var queued;
//
//  if (queued = this.queue.get('hash', tx.hash)) {
//    this.queue.remove('hash', queued.hash);
//  } else if (queued = this.queue.get('sequence', tx.seq)) {
//    if (queued.nullified) {
//      //Figures out new sequence number, signs, and sends to network
//      this.submit(queued);
//    }
//  }
//}

/**
 * User has given up, replace transaction with a null transaction
 *
 * @param {Object} tx
 */

//TransactionManager.prototype._nullify = function(tx) {
//  this.queue.remove('hash', tx.hash);
//}

/**
 */

//TransactionManager.prototype._timeout = function() {
//  var transactions = this.queue.get();
//  for (var i=0; i<transactions.length; i++) {
//    this.remote.submit(transactions[i].blob);
//  }
//  //restart the timer
//  this._timeout = setTimeout(function(){}, 10000); 
//}

/**
 * @param {Number} oldFee
 * @param {Number} newFee
 */

//TransactionManager.prototype._fee_change = function(oldFee, newFee) {
//  if (newFee > this._config.maxFee) {
//    if (this._timeout) clearTimeout(this._timeout);
//    return;
//  }
//
//  // resubmit everything raising fee if needed
//  for (var i=0; i<transactions.length; i++) {
//    var tx = transactions[i];
//
//    if (tx.fee < newFee) {
//      tx.fee  = newFee;
//      //tx.blob = signTransaction(tx, tx.seq, newFee);
//      //this.queue.add(tx);
//    }
//
//    this.remote.submit(tx.blob); 
//  }
//}

TransactionManager.prototype._request = function(tx) {
  var self   = this;
  var remote = this.remote;

  if (!tx._secret && !tx.tx_json.TxnSignature) {
    tx.emit('error', {
      result:          'tejSecretUnknown',
      result_message:  'Could not sign transactions because we.'
    });
    return;
  }  
  
  if (!remote.trusted && !remote.local_signing) {
    tx.emit('error', {
      result:          'tejServerUntrusted',
      result_message:  'Attempt to give a secret to an untrusted server.'
    });
    return;
  }

  tx.submit_index = remote._ledger_current_index;

  function finalize(message) {
    tx.finalized = true;
    tx.emit('final', message);
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
  
  function submission_success(message) {
    if (!message.engine_result) {
      return submission_error(message);
    } else {
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
  }

  function submission_error(err) {
    tx.set_state('remoteError');
    tx.emit('error', err);
  }

  submit_request.once('success', submission_success);
  submit_request.once('error', submission_error);

  //submit_request.timeout(1000 * 10, function() { 
    //tx.emit('error', new Error('Timeout'));
  //});

  submit_request.request();

  tx.set_state('client_submitted');
  tx.emit('submitted');

  return submit_request;
}

TransactionManager.prototype._is_not_found = function(error) {
  return !!error && typeof error === 'object'
      && typeof error.remote === 'object'
      && error.error === 'remoteError'
      && (error.remote.error === 'transactionNotFound' 
       || error.remote.error === 'ledgerNotFound')
      ;
}

TransactionManager.prototype._detect_ledger_entry = function(tx) {
  var self            = this;
  var remote          = this.remote;
  var checked_ledgers = { };

  function ledger_closed(message) {
    if (tx.finalized) {
      // Transaction has already erred or 
      // been detected in the ledger
      return;
    }

    var ledger_hash  = message.ledger_hash;
    var ledger_index = message.ledger_index;

    if (checked_ledgers.hasOwnProperty(ledger_hash)) {
      // Ledger with this hash has already been
      // checked to contain transaction
      return;
    }

    checked_ledgers[ledger_hash] = true;

    var request_transaction = remote.request_transaction_entry(tx.hash);

    request_transaction.ledger_hash(ledger_hash);

    request_transaction.callback(function(err, message) {
      if (tx.finalized) return;

      if (self._is_not_found(err)) {
        var dif = ledger_index - tx.submit_index;
        if (dif >= 8) {
          // Lost
          tx.emit('error', message);
          tx.emit('lost', message);
        } else if (dif >= 4) {
          // Missing
          tx.set_state('client_missing');
          tx.emit('pending', message);
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
    });
  }

  function transaction_proposed() {
    // Check the ledger for transaction entry
    remote.addListener('ledger_closed', ledger_closed);
  }

  function transaction_finalized() {
    // Stop checking the ledger
    remote.removeListener('ledger_closed', ledger_closed);
  }

  tx.once('proposed', transaction_proposed);
  tx.once('final', transaction_finalized);
}

/**
 * @param {Object} tx
 */

TransactionManager.prototype.submit = function(tx) {
  // If sequence number is not yet known, defer until it is.
  if (!this._next_sequence) {
    this.once('sequence_loaded', this.submit.bind(this, tx));
    return;
  }

  var seq = this._next_sequence++;
  var fee = tx.fee_units();

  if (fee <= this._config.max_fee) {
    tx.tx_json.Sequence = seq;
    tx.tx_json.Fee      = fee;
    tx.complete();

    this._request(tx);
  }
}

exports.TransactionManager = TransactionManager;
