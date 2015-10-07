'use strict';

const assert = require('assert-diff');
const {Amount} = require('../src/coretypes');

describe('Amount', function() {
  it('can be parsed from', function() {
    assert(Amount.from('1000000') instanceof Amount);
    assert.equal(Amount.from('1000000').valueString(), '1000000');
    const fixture = {
      'value': '1',
      'issuer': '0000000000000000000000000000000000000000',
      'currency': 'USD'
    };
    const amt = Amount.from(fixture);
    const rewritten = {
      'value': '1',
      'issuer': 'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
      'currency': 'USD'
    };
    assert.deepEqual(amt.toJSON(), rewritten);
  });
});

