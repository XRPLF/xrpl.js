/* eslint max-len: 0 */
'use strict';
const assert = require('assert');
const Seed = require('ripple-lib').Seed;

describe('Seed', function() {
  it('saESc82Vun7Ta5EJRzGJbrXb5HNYk', function() {
    const seed = Seed.from_json('saESc82Vun7Ta5EJRzGJbrXb5HNYk');
    assert.strictEqual(seed.to_hex(), 'FF1CF838D02B2CF7B45BAC27F5F24F4F');
  });
  it('sp6iDHnmiPN7tQFHm5sCW59ax3hfE', function() {
    const seed = Seed.from_json('sp6iDHnmiPN7tQFHm5sCW59ax3hfE');
    assert.strictEqual(seed.to_hex(), '00AD8DA764C3C8AF5F9B8D51C94B9E49');
  });
  it('throws an error when Seed.get_key() is called', function() {
    var seed = Seed.from_json('passphrase');
    assert.throws(function() {
      seed.get_key();
    });
  });
});
