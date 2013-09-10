var assert = require('assert');
var utils  = require('./testutils');
var Seed   = utils.load_module('seed').Seed;
var config = require('./testutils').get_config();

describe('Base58', function() {
  describe('Seed', function() {
    it('saESc82Vun7Ta5EJRzGJbrXb5HNYk', function () {
      var seed = Seed.from_json('saESc82Vun7Ta5EJRzGJbrXb5HNYk');
      assert.strictEqual(seed.to_hex(), 'FF1CF838D02B2CF7B45BAC27F5F24F4F');
    });
    it('sp6iDHnmiPN7tQFHm5sCW59ax3hfE',  function () {
      var seed = Seed.from_json('sp6iDHnmiPN7tQFHm5sCW59ax3hfE');
      assert.strictEqual(seed.to_hex(), '00AD8DA764C3C8AF5F9B8D51C94B9E49');
    });
  });
});

// vim:sw=2:sts=2:ts=8:et
