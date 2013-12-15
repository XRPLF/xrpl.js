function TransactionQueue() {
  this._queue  = [ ];
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