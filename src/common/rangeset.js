/* @flow */
'use strict';
const _ = require('lodash');
const assert = require('assert');
const ranges = Symbol();

function mergeIntervals(intervals: Array<[number, number]>) {
  const stack = [[-Infinity, -Infinity]];
  _.forEach(_.sortBy(intervals, x => x[0]), interval => {
    const lastInterval = stack.pop();
    if (interval[0] <= lastInterval[1] + 1) {
      stack.push([lastInterval[0], Math.max(interval[1], lastInterval[1])]);
    } else {
      stack.push(lastInterval);
      stack.push(interval);
    }
  });
  return stack.slice(1);
}

class RangeSet {
  constructor() {
    this.reset();
  }

  reset() {
    this[ranges] = [];
  }

  serialize() {
    return this[ranges].map(range =>
      range[0].toString() + '-' + range[1].toString()).join(',');
  }

  addRange(start: number, end: number) {
    assert(start <= end, 'invalid range');
    this[ranges] = mergeIntervals(this[ranges].concat([[start, end]]));
  }

  addValue(value: number) {
    this.addRange(value, value);
  }

  parseAndAddRanges(rangesString: string) {
    const rangeStrings = rangesString.split(',');
    _.forEach(rangeStrings, rangeString => {
      const range = rangeString.split('-').map(Number);
      this.addRange(range[0], range.length === 1 ? range[0] : range[1]);
    });
  }

  containsRange(start: number, end: number) {
    return _.some(this[ranges], range => range[0] <= start && range[1] >= end);
  }

  containsValue(value: number) {
    return this.containsRange(value, value);
  }
}

module.exports.RangeSet = RangeSet;
