
function TransactionQueue() {
  this._queue  = [ ];
}

TransactionQueue.prototype.length = function() {
  return this._queue.length;
};

TransactionQueue.prototype.push = function(o) {
  return this._queue.push(o);
};

TransactionQueue.prototype.hasHash = function(hash) {
  return this.indexOf('hash', hash) !== -1;
};

TransactionQueue.prototype.hasSequence = function(sequence) {
  return this.indexOf('sequence', sequence) !== -1;
};

TransactionQueue.prototype.indexOf = function(prop, val) {
  var index = -1;
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (tx[prop] === val) {
      index = i;
      break;
    }
  }
  return index;
};

TransactionQueue.prototype.removeSequence = function(sequence) {
  var result = [ ];
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (!tx.tx_json) continue;
    if (tx.tx_json.Sequence !== sequence) 
      result.push(tx);
  }
  this._queue = result;
};

TransactionQueue.prototype.removeHash = function(hash) {
  var result = [ ];
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (!tx.tx_json) continue;
    if (tx.hash !== hash)
      result.push(tx);
  }
  this._queue = result;
};

TransactionQueue.prototype.forEach = function(fn) {
  for (var i=0, tx; tx=this._queue[i]; i++) {
    fn(tx, i);
  }
};

exports.TransactionQueue = TransactionQueue;
