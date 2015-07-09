'use strict';
const assert = require('assert');
const RangeSet = require('ripple-lib')._test.RangeSet;

describe('RangeSet', function() {
  it('addRange()/addValue()', function() {
    const r = new RangeSet();

    r.addRange(4, 5);
    r.addRange(7, 10);
    r.addRange(1, 2);
    r.addValue(3);

    assert.deepEqual(r.serialize(), '1-5,7-10');
  });

  it('addValue()/addRange() -- malformed', function() {
    const r = new RangeSet();
    assert.throws(function() {
      r.addRange(2, 1);
    });
  });

  it('parseAndAddRanges()', function() {
    const r = new RangeSet();
    r.parseAndAddRanges('4-5,7-10,1-2,3-3');
    assert.deepEqual(r.serialize(), '1-5,7-10');
  });

  it('containsValue()', function() {
    const r = new RangeSet();

    r.addRange(32570, 11005146);
    r.addValue(11005147);

    assert.strictEqual(r.containsValue(1), false);
    assert.strictEqual(r.containsValue(32569), false);
    assert.strictEqual(r.containsValue(32570), true);
    assert.strictEqual(r.containsValue(50000), true);
    assert.strictEqual(r.containsValue(11005146), true);
    assert.strictEqual(r.containsValue(11005147), true);
    assert.strictEqual(r.containsValue(11005148), false);
    assert.strictEqual(r.containsValue(12000000), false);
  });

  it('reset()', function() {
    const r = new RangeSet();

    r.addRange(4, 5);
    r.addRange(7, 10);
    r.reset();

    assert.deepEqual(r.serialize(), '');
  });
});
