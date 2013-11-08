
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

TransactionQueue.prototype.hasHash = function(hash) {
  return this.indexOf('hash', hash) !== -1;
};

TransactionQueue.prototype.get = function(prop, val) {
  var index = this.indexOf(prop, val);
  return index > -1 ? this._queue[index] : false;
};

TransactionQueue.prototype.removeSequence = function(sequence) {
  var result = [ ];
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (!tx.tx_json) continue;
    if (tx.tx_json.Sequence !== sequence) result.push(tx);
  }
  this._queue = result;
};

TransactionQueue.prototype.removeHash = function(hash) {
  var result = [ ];
  for (var i=0, tx; tx=this._queue[i]; i++) {
    if (!tx.tx_json) continue;
    if (tx._hash !== hash) result.push(tx);
  }
  this._queue = result;
};

TransactionQueue.prototype.forEach = function() {
  Array.prototype.forEach.apply(this._queue, arguments);
};

TransactionQueue.prototype.push = function() {
  Array.prototype.push.apply(this._queue, arguments);
};

exports.TransactionQueue = TransactionQueue;
