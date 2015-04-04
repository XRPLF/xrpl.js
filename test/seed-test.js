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
  it('should return the key_pair for a valid account and secret pair', function() {
    const address = 'r3GgMwvgvP8h4yVWvjH1dPZNvC37TjzBBE';
    const seed = Seed.from_json('shsWGZcmZz6YsWWmcnpfr6fLTdtFV');
    const keyPair = seed.get_key();
    assert.strictEqual(keyPair.get_address().to_json(), address);
    assert.strictEqual(keyPair.to_hex_pub(),
      '02F89EAEC7667B30F33D0687BBA86C3FE2A08CCA40A9186C5BDE2DAA6FA97A37D8');
  });
});
