var assert     = require('assert');

var jsbn       = require('../src/js/ripple/jsbn');
var BigInteger = jsbn.BigInteger;

var Amount     = require('../src/js/ripple/amount').Amount;
var UInt160    = require('../src/js/ripple/uint160').UInt160;

var config     = require('./testutils').get_config();

describe('Amount', function() {
  describe('Negatives', function() {
    it('Number 1', function () {
      assert.strictEqual(Amount.from_human('0').add(Amount.from_human('-1')).to_human(), '-1');
    });
  });
  describe('from_number', function() {
    it('Number 1', function() {
      assert.strictEqual(Amount.from_number(1).to_text_full(), '1/1/rrrrrrrrrrrrrrrrrrrrBZbvji');
    });
  });
  describe('UInt160', function() {
    it('Parse 0', function () {
      assert.deepEqual(jsbn.nbi(), UInt160.from_generic('0')._value);
    });
    it('Parse 0 export', function () {
      assert.strictEqual(UInt160.ACCOUNT_ZERO, UInt160.from_generic('0').to_json());
    });
    it('Parse 1', function () {
      assert.deepEqual(new BigInteger([1]), UInt160.from_generic('1')._value);
    });
    it('Parse rrrrrrrrrrrrrrrrrrrrrhoLvTp export', function () {
      assert.strictEqual(UInt160.ACCOUNT_ZERO, UInt160.from_json('rrrrrrrrrrrrrrrrrrrrrhoLvTp').to_json());
    });
    it('Parse rrrrrrrrrrrrrrrrrrrrBZbvji export', function () {
      assert.strictEqual(UInt160.ACCOUNT_ONE, UInt160.from_json('rrrrrrrrrrrrrrrrrrrrBZbvji').to_json());
    });
    it('Parse mtgox export', function () {
      assert.strictEqual(config.accounts['mtgox'].account, UInt160.from_json('mtgox').to_json());
    });
    it('is_valid rrrrrrrrrrrrrrrrrrrrrhoLvTp', function () {
      assert(UInt160.is_valid('rrrrrrrrrrrrrrrrrrrrrhoLvTp'));
    });
    it('!is_valid rrrrrrrrrrrrrrrrrrrrrhoLvT', function () {
      assert(!UInt160.is_valid('rrrrrrrrrrrrrrrrrrrrrhoLvT'));
    });
  });
  describe('Amount parsing', function() {
    it('Parse 800/USD/mtgox', function () {
      assert.strictEqual('800/USD/'+config.accounts['mtgox'].account, Amount.from_json('800/USD/mtgox').to_text_full());
    });
    it('Parse native 0', function () {
      assert.strictEqual('0/XRP', Amount.from_json('0').to_text_full());
    });
    it('Parse native 0.0', function () {
      assert.strictEqual('0/XRP', Amount.from_json('0.0').to_text_full());
    });
    it('Parse native -0', function () {
      assert.strictEqual('0/XRP', Amount.from_json('-0').to_text_full());
    });
    it('Parse native -0.0', function () {
      assert.strictEqual('0/XRP', Amount.from_json('-0.0').to_text_full());
    });
    it('Parse native 1000', function () {
      assert.strictEqual('0.001/XRP', Amount.from_json('1000').to_text_full());
    });
    it('Parse native 12.3', function () {
      assert.strictEqual('12.3/XRP', Amount.from_json('12.3').to_text_full());
    });
    it('Parse native -12.3', function () {
      assert.strictEqual('-12.3/XRP', Amount.from_json('-12.3').to_text_full());
    });
    it('Parse 123./USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      assert.strictEqual('123/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('123./USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').to_text_full());
    });
    it('Parse 12300/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      assert.strictEqual('12300/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('12300/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').to_text_full());
    });
    it('Parse 12.3/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      assert.strictEqual('12.3/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('12.3/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').to_text_full());
    });
    it('Parse 1.2300/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      assert.strictEqual('1.23/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('1.2300/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').to_text_full());
    });
    it('Parse -0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      assert.strictEqual('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').to_text_full());
    });
    it('Parse -0.0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function () {
      assert.strictEqual('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-0.0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').to_text_full());
    });
  });
  describe('Amount operations', function() {
    it('Negate native 123', function () {
      assert.strictEqual('-0.000123/XRP', Amount.from_json('123').negate().to_text_full());
    });
    it('Negate native -123', function () {
      assert.strictEqual('0.000123/XRP', Amount.from_json('-123').negate().to_text_full());
    });
    it('Negate non-native 123', function () {
      assert.strictEqual('-123/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('123/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').negate().to_text_full());
    });
    it('Negate non-native -123', function () {
      assert.strictEqual('123/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-123/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').negate().to_text_full());
    });
    it('Clone non-native -123', function () {
      assert.strictEqual('-123/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-123/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').clone().to_text_full());
    });
    it('Add XRP to XRP', function () {
      assert.strictEqual('0.0002/XRP', Amount.from_json('150').add(Amount.from_json('50')).to_text_full());
    });
    it('Add USD to USD', function () {
      assert.strictEqual('200.52/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('150.02/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').add(Amount.from_json('50.5/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply 0 XRP with 0 XRP', function () {
      assert.strictEqual('0/XRP', Amount.from_json('0').multiply(Amount.from_json('0')).to_text_full());
    });
    it('Multiply 0 USD with 0 XRP', function () {
      assert.strictEqual('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('0')).to_text_full());
    });
    it('Multiply 0 XRP with 0 USD', function () {
      assert.strictEqual('0/XRP', Amount.from_json('0').multiply(Amount.from_json('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply 1 XRP with 0 XRP', function () {
      assert.strictEqual('0/XRP', Amount.from_json('1').multiply(Amount.from_json('0')).to_text_full());
    });
    it('Multiply 1 USD with 0 XRP', function () {
      assert.strictEqual('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('0')).to_text_full());
    });
    it('Multiply 1 XRP with 0 USD', function () {
      assert.strictEqual('0/XRP', Amount.from_json('1').multiply(Amount.from_json('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply 0 XRP with 1 XRP', function () {
      assert.strictEqual('0/XRP', Amount.from_json('0').multiply(Amount.from_json('1')).to_text_full());
    });
    it('Multiply 0 USD with 1 XRP', function () {
      assert.strictEqual('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('0/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('1')).to_text_full());
    });
    it('Multiply 0 XRP with 1 USD', function () {
      assert.strictEqual('0/XRP', Amount.from_json('0').multiply(Amount.from_json('1/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply XRP with USD', function () {
      assert.equal('0.002/XRP', Amount.from_json('200').multiply(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply XRP with USD', function () {
      assert.strictEqual('0.2/XRP', Amount.from_json('20000').multiply(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply XRP with USD', function () {
      assert.strictEqual('20/XRP', Amount.from_json('2000000').multiply(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply XRP with USD, neg', function () {
      assert.strictEqual('-0.002/XRP', Amount.from_json('200').multiply(Amount.from_json('-10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply XRP with USD, neg, frac', function () {
      assert.strictEqual('-0.222/XRP', Amount.from_json('-6000').multiply(Amount.from_json('37/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply USD with USD', function () {
      assert.strictEqual('20000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('2000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply USD with USD', function () {
      assert.strictEqual('200000000000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('2000000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('100000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply EUR with USD, result < 1', function () {
      assert.strictEqual('100000/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('1000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply EUR with USD, neg', function () {
      assert.strictEqual('-48000000/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-24000/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('2000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply EUR with USD, neg, <1', function () {
      assert.strictEqual('-100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('0.1/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('-1000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Multiply EUR with XRP, factor < 1', function () {
      assert.strictEqual('100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('0.05/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('2000')).to_text_full());
    });
    it('Multiply EUR with XRP, neg', function () {
      assert.strictEqual('-500/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('5')).to_text_full());
    });
    it('Multiply EUR with XRP, neg, <1', function () {
      assert.strictEqual('-100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-0.05/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').multiply(Amount.from_json('2000')).to_text_full());
    });
    it('Multiply XRP with XRP', function () {
      assert.strictEqual('0.0001/XRP', Amount.from_json('10').multiply(Amount.from_json('10')).to_text_full());
    });
    it('Divide XRP by USD', function () {
      assert.strictEqual('0.00002/XRP', Amount.from_json('200').divide(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide XRP by USD', function () {
      assert.strictEqual('0.002/XRP', Amount.from_json('20000').divide(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide XRP by USD', function () {
      assert.strictEqual('0.2/XRP', Amount.from_json('2000000').divide(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide XRP by USD, neg', function () {
      assert.strictEqual('-0.00002/XRP', Amount.from_json('200').divide(Amount.from_json('-10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide XRP by USD, neg, frac', function () {
      assert.strictEqual('-0.000162/XRP', Amount.from_json('-6000').divide(Amount.from_json('37/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide USD by USD', function () {
      assert.strictEqual('200/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('2000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('10/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide USD by USD, fractional', function () {
      assert.strictEqual('57142.85714285714/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('2000000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('35/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide USD by USD', function () {
      assert.strictEqual('20/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('2000000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('100000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide EUR by USD, factor < 1', function () {
      assert.strictEqual('0.1/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('1000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide EUR by USD, neg', function () {
      assert.strictEqual('-12/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-24000/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('2000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide EUR by USD, neg, <1', function () {
      assert.strictEqual('-0.1/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('-1000/USD/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh')).to_text_full());
    });
    it('Divide EUR by XRP, result < 1', function () {
      assert.strictEqual('0.05/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('2000')).to_text_full());
    });
    it('Divide EUR by XRP, neg', function () {
      assert.strictEqual('-20/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('5')).to_text_full());
    });
    it('Divide EUR by XRP, neg, <1', function () {
      assert.strictEqual('-0.05/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', Amount.from_json('-100/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh').divide(Amount.from_json('2000')).to_text_full());
    });
  });
  describe('Amount comparisons', function() {
    it('0 USD == 0 USD', function () {
      var a = Amount.from_json('0/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('0/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('0 USD == -0 USD', function () {
      var a = Amount.from_json('0/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('-0/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('0 XRP == 0 XRP', function () {
      var a = Amount.from_json('0');
      var b = Amount.from_json('0.0');
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('0 XRP == -0 XRP', function () {
      var a = Amount.from_json('0');
      var b = Amount.from_json('-0');
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('10 USD == 10 USD', function () {
      var a = Amount.from_json('10/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('10/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('123.4567 USD == 123.4567 USD', function () {
      var a = Amount.from_json('123.4567/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('123.4567/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('10 XRP == 10 XRP', function () {
      var a = Amount.from_json('10');
      var b = Amount.from_json('10');
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('1.1 XRP == 1.1 XRP', function () {
      var a = Amount.from_json('1.1');
      var b = Amount.from_json('11.0').ratio_human(10);
      assert(a.equals(b));
      assert(!a.not_equals_why(b));
    });
    it('0 USD == 0 USD (ignore issuer)', function () {
      var a = Amount.from_json('0/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('0/USD/rH5aWQJ4R7v4Mpyf4kDBUvDFT5cbpFq3XP');
      assert(a.equals(b, true));
      assert(!a.not_equals_why(b, true));
    });
    it('1.1 USD == 1.10 USD (ignore issuer)', function () {
      var a = Amount.from_json('1.1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('1.10/USD/rH5aWQJ4R7v4Mpyf4kDBUvDFT5cbpFq3XP');
      assert(a.equals(b, true));
      assert(!a.not_equals_why(b, true));
    });
    // Exponent mismatch
    it('10 USD != 100 USD', function () {
      var a = Amount.from_json('10/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('100/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Non-XRP value differs.');
    });
    it('10 XRP != 100 XRP', function () {
      var a = Amount.from_json('10');
      var b = Amount.from_json('100');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'XRP value differs.');
    });
    // Mantissa mismatch
    it('1 USD != 2 USD', function () {
      var a = Amount.from_json('1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('2/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Non-XRP value differs.');
    });
    it('1 XRP != 2 XRP', function () {
      var a = Amount.from_json('1');
      var b = Amount.from_json('2');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'XRP value differs.');
    });
    it('0.1 USD != 0.2 USD', function () {
      var a = Amount.from_json('0.1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('0.2/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Non-XRP value differs.');
    });
    // Sign mismatch
    it('1 USD != -1 USD', function () {
      var a = Amount.from_json('1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('-1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Non-XRP sign differs.');
    });
    it('1 XRP != -1 XRP', function () {
      var a = Amount.from_json('1');
      var b = Amount.from_json('-1');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'XRP sign differs.');
    });
    it('1 USD != 1 USD (issuer mismatch)', function () {
      var a = Amount.from_json('1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('1/USD/rH5aWQJ4R7v4Mpyf4kDBUvDFT5cbpFq3XP');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Non-XRP issuer differs: rH5aWQJ4R7v4Mpyf4kDBUvDFT5cbpFq3XP/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
    });
    it('1 USD != 1 EUR', function () {
      var a = Amount.from_json('1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('1/EUR/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Non-XRP currency differs.');
    });
    it('1 USD != 1 XRP', function () {
      var a = Amount.from_json('1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      var b = Amount.from_json('1');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Native mismatch.');
    });
    it('1 XRP != 1 USD', function () {
      var a = Amount.from_json('1');
      var b = Amount.from_json('1/USD/rNDKeo9RrCiRdfsMG8AdoZvNZxHASGzbZL');
      assert(!a.equals(b));
      assert.strictEqual(a.not_equals_why(b), 'Native mismatch.');
    });
  });
});
