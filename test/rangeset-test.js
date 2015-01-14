var assert = require('assert');
var RangeSet = require('ripple-lib').RangeSet;

describe('RangeSet', function() {
  it('add()', function() {
    var r = new RangeSet();

    r.add('4-5');
    r.add('7-10');
    r.add('1-2');
    r.add('3');

    assert.deepEqual(r._ranges, [
      { start: 1, end: 2 },
      { start: 3, end: 3 },
      { start: 4, end: 5 },
      { start: 7, end: 10 }
    ]);
  });

  it('add() -- malformed range', function() {
    var r = new RangeSet();

    assert.throws(function() {
      r.add(null);
    });
    assert.throws(function() {
      r.add(void(0));
    });
    assert.throws(function() {
      r.add('a');
    });
    assert.throws(function() {
      r.add('2-1');
    });
  });

  it('contains()', function() {
    var r = new RangeSet();

    r.add('32570-11005146');
    r.add('11005147');

    assert.strictEqual(r.contains(1), false);
    assert.strictEqual(r.contains(32569), false);
    assert.strictEqual(r.contains(32570), true);
    assert.strictEqual(r.contains('32570'), true);
    assert.strictEqual(r.contains(50000), true);
    assert.strictEqual(r.contains(11005146), true);
    assert.strictEqual(r.contains(11005147), true);
    assert.strictEqual(r.contains(11005148), false);
    assert.strictEqual(r.contains(12000000), false);
  });

  it('contains() -- invalid ledger', function() {
    var r = new RangeSet();

    assert.throws(function() {
      r.contains(null);
    });
    assert.throws(function() {
      r.contains(void(0));
    });
    assert.throws(function() {
      r.contains('a');
    });
  });

  it('reset()', function() {
    var r = new RangeSet();

    r.add('4-5');
    r.add('7-10');
    r.reset();

    assert.deepEqual(r._ranges, [ ]);
  });
});
