const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const {Amount} = require('../src/coretypes');
const {loadFixture} = utils;
const fixtures = loadFixture('data-driven-tests.json');

function amountErrorTests() {
  _.filter(fixtures.values_tests, {type: 'Amount'}).forEach(f => {
    // We only want these with errors
    if (!f.error) {
      return
    }
    const testName = `${JSON.stringify(f.test_json)}\n\tis invalid ` +
                     `because: ${f.error}`
    it(testName, () => {
      assert.throws(() => {
        Amount.from(f.test_json);
      }, JSON.stringify(f.test_json));
    });
  });
}

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
  amountErrorTests()
});

