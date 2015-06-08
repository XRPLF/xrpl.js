'use strict';
const _ = require('lodash');

const SEED =
  '3045022100A58B0460BC5092CB4F96155C19125A4E079C870663F1D5E8BBC9BD0';

function MockPRNG(seed) {
  if (seed && seed.length < 8) {
    throw new Error('seed must be a hex string of at least 8 characters');
  }
  this.position = 0;
  this.seed = seed || SEED;
}

MockPRNG.prototype.randomWord = function() {
  const i = this.position;
  this.position = (i + 8) % this.seed.length;
  const data = this.seed + this.seed.slice(8);
  return parseInt(data.slice(i, i + 8), 16);
};

MockPRNG.prototype.randomWords = function(n) {
  return _.times(n, () => this.randomWord());
};

module.exports = MockPRNG;
