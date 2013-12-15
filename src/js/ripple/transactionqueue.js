
function TransactionQueue() {
  var self = this;

  this._queue  = [ ];

  Object.defineProperty(this, '_length', {
    get: function() { return self._queue.length }
  });
}

TransactionQueue.prototype.length = function() {
  return this._queue.length;
};

TransactionQueue.prototype.getBySubmissions = function(hash) {
  for (var i=0, tx; tx=this._queue[i]; i++) {
    for (var j=0, id; id=tx.submittedTxnIDs[j]; j++) {
      if (hash === id) {
        return tx;
      };
    }
  }
  return false;
};

/*TransactionQueue.prototype.indexOf = function(prop, val) {
  var index = -1;
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (tx[prop] === val) {
      index = i;
      break;
    }
  }
  return index;
};
*/
  // ND: fixed `hash` vs _`hash`
/*TransactionQueue.prototype.hasHash = function(hash) {
  return this.indexOf('_hash', hash) !== -1;
};
*/


/*TransactionQueue.prototype.get = function(prop, val) {
  var index = this.indexOf(prop, val);
  return index > -1 ? this._queue[index] : false;
};
*/

// ND: These are unused
/*TransactionQueue.prototype.removeSequence = function(sequence) {
  var result = [ ];
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (!tx.tx_json) continue;
    if (tx.tx_json.Sequence !== sequence) result.push(tx);
  }
  this._queue = result;
};
*/
/*TransactionQueue.prototype.removeHash = function(hash) {
  var result = [ ];
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (!tx.tx_json) continue;
    if (tx.hash !== hash) result.push(tx);
  }
  this._queue = result;
};
*/

// ND: We are just removing the Transaction by identity
TransactionQueue.prototype.remove = function(removedTx) {
  for (var i = this._queue.length - 1; i >= 0; i--) {
    if (this._queue[i] === removedTx) {
      this._queue.splice(i, 1);
      break;
    };
  };
};

TransactionQueue.prototype.forEach = function() {
  Array.prototype.forEach.apply(this._queue, arguments);
};

TransactionQueue.prototype.push = function() {
  Array.prototype.push.apply(this._queue, arguments);
};

exports.TransactionQueue = TransactionQueue;
