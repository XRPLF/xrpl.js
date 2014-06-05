
/**
 * Manager for pending transactions
 */

var LRU = require('lru-cache');
var Transaction = require('./transaction').Transaction;

function TransactionQueue() {
  this._queue = [ ];
  this._idCache = LRU();
  this._sequenceCache = LRU();
};

/**
 * Store received (validated) sequence
 */

TransactionQueue.prototype.addReceivedSequence = function(sequence) {
  this._sequenceCache.set(String(sequence), true);
};

/**
 * Check that sequence number has been consumed by a validated
 * transaction
 */

TransactionQueue.prototype.hasSequence = function(sequence) {
  return this._sequenceCache.has(String(sequence));
};

/**
 * Store received (validated) ID transaction
 */

TransactionQueue.prototype.addReceivedId = function(id, transaction) {
  this._idCache.set(id, transaction);
};

/**
 * Get received (validated) transaction by ID
 */

TransactionQueue.prototype.getReceived = function(id) {
  return this._idCache.get(id);
};

/**
 * Get a submitted transaction by ID. Transactions
 * may have multiple associated IDs.
 */

TransactionQueue.prototype.getSubmission = function(id) {
  var result = void(0);

  for (var i=0, tx; (tx=this._queue[i]); i++) {
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
  var i = this._queue.length;

  if (typeof tx === 'string') {
    tx = this.getSubmission(tx);
  }

  if (!(tx instanceof Transaction)) {
    return;
  }

  while (i--) {
    if (this._queue[i] === tx) {
      this._queue.splice(i, 1);
      break;
    }
  }
};

TransactionQueue.prototype.push = function(tx) {
  this._queue.push(tx);
};

TransactionQueue.prototype.forEach = function(fn) {
  this._queue.forEach(fn);
};

TransactionQueue.prototype.length =
TransactionQueue.prototype.getLength = function() {
  return this._queue.length;
};

exports.TransactionQueue = TransactionQueue;
