var assert = require('assert');
var lodash = require('lodash');

function RangeSet() {
  this._ranges = [ ];
};

/**
 * Add a ledger range
 *
 * @param {Number|String} range string (n-n2,n3-n4)
 */

RangeSet.prototype.add = function(range) {
  assert(typeof range !== 'number' || !isNaN(range), 'Ledger range malformed');

  range = String(range).split(',');

  if (range.length > 1) {
    return range.forEach(this.add, this);
  }

  range = range[0].split('-').map(Number);

  var lRange = {
    start: range[0],
    end: range[range.length === 1 ? 0 : 1]
  };

  // Comparisons on NaN should be falsy
  assert(lRange.start <= lRange.end, 'Ledger range malformed');

  var insertionPoint = lodash.sortedIndex(this._ranges, lRange, function(r) {
    return r.start;
  });

  this._ranges.splice(insertionPoint, 0, lRange);
};


/*
 * Check presence of ledger in range
 *
 * @param {Number|String} ledger
 * @return Boolean
 */

RangeSet.prototype.has =
RangeSet.prototype.contains = function(ledger) {
  assert(ledger != null && !isNaN(ledger), 'Ledger must be a number');

  ledger = Number(ledger);

  return this._ranges.some(function(r) {
    return ledger >= r.start && ledger <= r.end;
  });
};

/**
 * Reset ledger ranges
 */

RangeSet.prototype.reset = function() {
  this._ranges = [ ];
};

exports.RangeSet = RangeSet;
