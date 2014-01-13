
/**
 * Manager for pending transactions
 */

function TransactionQueue() {
  this._queue         = [ ];
  this._idCache       = { };
  this._sequenceCache = { };
}

/**
 * Store received (validated) sequence
 */

TransactionQueue.prototype.addReceivedSequence = function(sequence) {
  this._sequenceCache[sequence] = true;
};

/**
 * Store received (validated) ID transaction
 */

TransactionQueue.prototype.addReceivedId = function(id, transaction) {
  this._idCache[id] = transaction;
};

/**
 * Get received (validated) transaction by ID
 */

TransactionQueue.prototype.getReceived = function(id) {
  return this._idCache[id];
};

/**
 * Check that sequence number has been consumed by a validated
 * transaction
 */

TransactionQueue.prototype.hasSequence = function(sequence) {
  return this._sequenceCache[sequence] || false;
};

/**
 * Get a submitted transaction by ID. Transactions
 * may have multiple associated IDs.
 */

TransactionQueue.prototype.getSubmission = function(id) {
  var result = false;

  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (~tx.submittedIDs.indexOf(id)) {
      result = tx;
      break;
    }
  }

  return result;
};

/**
 * Remove a transaction from the queue
 */

TransactionQueue.prototype.remove = function(tx) {
  // ND: We are just removing the Transaction by identity
  var i = this.length();
  while (i--) {
    if (this._queue[i] === tx) {
      this._queue.splice(i, 1);
      break;
    }
  }
};

/**
 * Get pending length
 */

TransactionQueue.prototype.length = function() {
  return this._queue.length;
};

[
  'forEach',
  'push',
  'pop',
  'shift',
  'unshift'
].forEach(function(fn) {
  TransactionQueue.prototype[fn] = function() {
    Array.prototype[fn].apply(this._queue, arguments);
  };
});

exports.TransactionQueue = TransactionQueue;
