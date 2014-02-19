
/**
 * Manager for pending transactions
 */

var Transaction = require('./transaction').Transaction;

function TransactionQueue() {
  var self = this;

  this._queue         = [ ];
  this._idCache       = { };
  this._sequenceCache = { };
  this._save          = void(0);
};

TransactionQueue.prototype.clearCache = function() {
  this._idCache       = { };
  this._sequenceCache = { };
};

TransactionQueue.prototype.save = function() {
  if (typeof this._save !== 'function') return;

  this._save(this._queue.map(function(tx) {
    return {
      tx_json: tx.tx_json,
      submittedIDs: tx.submittedIDs
    }
  }));
};

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

TransactionQueue.prototype.getSubmission = function(id, callback) {
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
  var i = this._queue.length;

  while (i--) {
    if (this._queue[i] === tx) {
      this._queue.splice(i, 1);
      break;
    }
  }

  if (!this._queue.length) {
    this.clearCache();
  }

  this.save();
};

TransactionQueue.prototype.push = function(tx) {
  this._queue.push(tx);
  this.save();
};

TransactionQueue.prototype.forEach = function(fn) {
  this._queue.forEach(fn);
};

TransactionQueue.prototype.length = function() {
  return this._queue.length;
};

exports.TransactionQueue = TransactionQueue;
