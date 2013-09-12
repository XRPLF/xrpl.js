var assert   = require('assert');
var utils    = require('./testutils');
var currency = utils.load_module('currency').Currency;

describe('Currency', function() {
  describe('json_rewrite', function() {
    it('json_rewrite("USD") == "USD"', function() {
      assert.strictEqual('USD', currency.json_rewrite('USD'));
    });
    it('json_rewrite("NaN") == "XRP"', function() {
      assert.strictEqual('XRP', currency.json_rewrite(NaN));
    });
  });
  describe('from_json', function() {
    it('from_json(NaN).to_json() == "XRP"', function() {
      var r = currency.from_json(NaN);
      assert(!r.is_valid());
      assert.strictEqual('XRP', r.to_json());
    });
    it('from_json("XRP").to_json() == "XRP"', function() {
      var r = currency.from_json('XRP');
      assert.strictEqual(0, r._value);
      assert(r.is_valid());
      assert.strictEqual('XRP', r.to_json());
    });
  });
  describe('parse_json(currency obj)', function() {
    assert.strictEqual('USD', new currency().parse_json(currency.from_json('USD')).to_json());
  });
  describe('is_valid', function() {
    it('Currency.is_valid("XRP")', function() {
      assert(currency.is_valid('XRP'));
    });
    it('!Currency.is_valid(NaN)', function() {
      assert(!currency.is_valid(NaN));
    });
    it('from_json("XRP").is_valid()', function() {
      assert(currency.from_json('XRP').is_valid());
    });
    it('!from_json(NaN).is_valid()', function() {
      assert(!currency.from_json(NaN).is_valid());
    });
  });
  describe('clone', function() {
    it('should clone currency object', function() {
      var c = currency.from_json('XRP');
      assert.strictEqual('XRP', c.clone().to_json());
    });
  });
  describe('to_human', function() {
    it('should generate human string', function() {
      assert.strictEqual('XRP', currency.from_json('XRP').to_human());
    });
  });
});
