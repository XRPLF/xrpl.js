/*eslint-disable */

var assert   = require('assert');
var currency = require('ripple-lib').Currency;
var timeUtil = require('ripple-lib').utils.time;

describe('Currency', function() {
  describe('json_rewrite', function() {
    it('json_rewrite("USD") == "USD"', function() {
      assert.strictEqual('USD', currency.json_rewrite('USD'));
    });
  });
  describe('from_json', function() {
    it('from_json().to_json() == "XRP"', function() {
      var r = currency.from_json();
      assert.strictEqual('XRP', r.to_json());
    });
    it('from_json().to_json("") == "XRP"', function() {
      var r = currency.from_json('');
      assert(r.is_valid());
      assert(r.is_native());
      assert.strictEqual('XRP', r.to_json());
    });
    it('from_json("XRP").to_json() == "XRP"', function() {
      var r = currency.from_json('XRP');
      assert(r.is_valid());
      assert(r.is_native());
      assert.strictEqual('XRP', r.to_json());
    });
    it('from_json("0000000000000000000000000000000000000000").to_json() == "XRP"', function() {
      var r = currency.from_json('0000000000000000000000000000000000000000');
      assert(r.is_valid());
      assert(r.is_native());
      assert.strictEqual('XRP', r.to_json());
    });
    it('from_json("111").to_human()', function() {
      var r = currency.from_json("111");
      assert(r.is_valid());
      assert.strictEqual('111', r.to_json());
    });
    it('from_json("1D2").to_human()', function() {
      var r = currency.from_json("1D2");
      assert(r.is_valid());
      assert.strictEqual('1D2', r.to_json());
    });
    it('from_json("1").to_human()', function() {
      var r = currency.from_json('1');
      assert(r.is_valid());
      assert.strictEqual(1, r.to_json());
    });
    it('from_json("#$%").to_human()', function() {
      var r = currency.from_json('#$%');
      assert(r.is_valid());
      assert.strictEqual('0000000000000000000000002324250000000000', r.to_json());
    });
    it('from_json("XAU").to_json() hex', function() {
      var r = currency.from_json("XAU");
      assert.strictEqual('0000000000000000000000005841550000000000', r.to_json({force_hex: true}));
    });
    it('json_rewrite("015841550000000041F78E0A28CBF19200000000") hex', function() {
      var r = currency.json_rewrite('015841550000000041F78E0A28CBF19200000000', {force_hex: true});
      assert.strictEqual('015841550000000041F78E0A28CBF19200000000', r);
    });
  });

  describe('from_hex', function() {
    it('"015841551A748AD2C1F76FF6ECB0CCCD00000000" === "XAU (-0.5%pa)"', function() {
      var cur = currency.from_hex('015841551A748AD2C1F76FF6ECB0CCCD00000000');
      assert.strictEqual(cur.to_hex(), '015841551A748AD2C1F76FF6ECB0CCCD00000000');
    });
  });
  describe('parse_json', function() {
    it('should parse a currency object', function() {
      assert.strictEqual('USD', new currency().parse_json(currency.from_json('USD')).to_json());
    });
    it('should clone for parse_json on itself', function() {
      var cur = currency.from_json('USD');
      var cur2 = currency.from_json(cur);
      assert.strictEqual(cur.to_json(), cur2.to_json());

      cur = currency.from_hex('015841551A748AD2C1F76FF6ECB0CCCD00000000');
      cur2 = currency.from_json(cur);
      assert.strictEqual(cur.to_json(), cur2.to_json());
    });
    it('should parse json 0', function() {
      var cur = currency.from_json(0);
      assert.strictEqual(cur.to_json(), 'XRP');
      assert.strictEqual(cur.get_iso(), 'XRP');
    });
    it('should parse json 0', function() {
      var cur = currency.from_json('0');
      assert.strictEqual(cur.to_json(), 'XRP');
      assert.strictEqual(cur.get_iso(), 'XRP');
    });
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
  describe('get_iso', function() {
    it('should get "XRP" iso_code', function() {
      assert.strictEqual('XRP', currency.from_json('XRP').get_iso());
    });
    it('should get iso_code', function() {
      assert.strictEqual('USD', currency.from_json('USD - US Dollar').get_iso());
    });
    it('should get iso_code', function() {
      assert.strictEqual('USD', currency.from_json('USD (0.5%pa)').get_iso());
    });
  });
});
