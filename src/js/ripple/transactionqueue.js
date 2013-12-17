function TransactionQueue() {
  this._queue  = [ ];
}

TransactionQueue.prototype.length = function() {
  return this._queue.length;
};

TransactionQueue.prototype.getBySubmissions = function(hash) {
  var result = false;

  top:
  for (var i=0, tx; tx=this._queue[i]; i++) {
    for (var j=0, id; id=tx.submittedTxnIDs[j]; j++) {
      if (hash === id) {
        result = tx;
        break top;
      };
    }
  }

  return result;
};

// ND: We are just removing the Transaction by identity
TransactionQueue.prototype.remove = function(removedTx) {
  top:
  for (var i = this._queue.length - 1; i >= 0; i--) {
    if (this._queue[i] === removedTx) {
      this._queue.splice(i, 1);
      break top;
    };
  };
};

[ 'forEach', 'push', 'shift', 'unshift' ].forEach(function(fn) {
  TransactionQueue.prototype[fn] = function() {
    Array.prototype[fn].apply(this._queue, arguments);
  };
});

exports.TransactionQueue = TransactionQueue;
