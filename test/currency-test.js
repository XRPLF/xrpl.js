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
    it('json_rewrite("015841551A748AD2C1F76FF6ECB0CCCD00000000") == "015841551A748AD2C1F76FF6ECB0CCCD00000000"', function() {
      assert.strictEqual(currency.json_rewrite("015841551A748AD2C1F76FF6ECB0CCCD00000000"),
                         '015841551A748AD2C1F76FF6ECB0CCCD00000000');
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
      assert(r.is_valid());
      assert(r.is_native());
      assert.strictEqual('XRP', r.to_json());
    });
  });
  describe('to_human', function() {
    it('"USD".to_human() == "USD"', function() {
      assert.strictEqual('USD', currency.from_json('USD').to_human());
    });
    it('"NaN".to_human() == "XRP"', function() {
      assert.strictEqual('XRP', currency.from_json(NaN).to_human());
    });
    it('"015841551A748AD2C1F76FF6ECB0CCCD00000000") == "015841551A748AD2C1F76FF6ECB0CCCD00000000"', function() {
      assert.strictEqual(currency.from_json("015841551A748AD2C1F76FF6ECB0CCCD00000000").to_human(),
                         'XAU');
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
  describe('has_interest', function() {
    it('should be true for type 1 currency codes', function() {
      assert(currency.from_hex('015841551A748AD2C1F76FF6ECB0CCCD00000000').has_interest());
      assert(currency.from_json('015841551A748AD2C1F76FF6ECB0CCCD00000000').has_interest());
    });
    it('should be false for type 0 currency codes', function() {
      assert(!currency.from_hex('0000000000000000000000005553440000000000').has_interest());
      assert(!currency.from_json('USD').has_interest());
    });
  });
  function precision(num, precision) {
    return +(Math.round(num + "e+"+precision)  + "e-"+precision);
  }
  describe('get_interest_at', function() {
    it('returns demurred value for demurrage currency', function() {
      var cur = currency.from_json('015841551A748AD2C1F76FF6ECB0CCCD00000000');

      // At start, no demurrage should occur
      assert.equal(1, cur.get_interest_at(443845330));

      // After one year, 0.5% should have occurred
      assert.equal(0.995, precision(cur.get_interest_at(443845330 + 31536000), 14));

      // After one demurrage period, 1/e should have occurred
      assert.equal(1/Math.E, cur.get_interest_at(443845330 + 6291418827.05));

      // One year before start, it should be (roughly) 0.5% higher.
      assert.equal(1.005, precision(cur.get_interest_at(443845330 - 31536000), 4));

      // One demurrage period before start, rate should be e
      assert.equal(Math.E, cur.get_interest_at(443845330 - 6291418827.05));
    });
  });
});
