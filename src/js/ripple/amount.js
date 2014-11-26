// Represent Ripple amounts and currencies.
// - Numbers in hex are big-endian.

var extend = require('extend');
var utils = require('./utils');
var sjcl  = utils.sjcl;
var bn    = sjcl.bn;

var BigInteger = utils.jsbn.BigInteger;

var UInt160  = require('./uint160').UInt160;
var Seed     = require('./seed').Seed;
var Currency = require('./currency').Currency;

//
// Amount class in the style of Java's BigInteger class
// http://docs.oracle.com/javase/1.3/docs/api/java/math/BigInteger.html
//

function Amount() {
  // Json format:
  //  integer : XRP
  //  { 'value' : ..., 'currency' : ..., 'issuer' : ...}

  this._value       = new BigInteger(); // NaN for bad value. Always positive.
  this._offset      = 0; // Always 0 for XRP.
  this._is_native   = true; // Default to XRP. Only valid if value is not NaN.
  this._is_negative = false;
  this._currency    = new Currency();
  this._issuer      = new UInt160();
};

var consts = {
  currency_xns:      0,
  currency_one:      1,
  xns_precision:     6,

  // BigInteger values prefixed with bi_.
  bi_5:              new BigInteger('5'),
  bi_7:              new BigInteger('7'),
  bi_10:             new BigInteger('10'),
  bi_1e14:           new BigInteger(String(1e14)),
  bi_1e16:           new BigInteger(String(1e16)),
  bi_1e17:           new BigInteger(String(1e17)),
  bi_1e32:           new BigInteger('100000000000000000000000000000000'),
  bi_man_max_value:  new BigInteger('9999999999999999'),
  bi_man_min_value:  new BigInteger('1000000000000000'),
  bi_xns_max:        new BigInteger('9000000000000000000'), // Json wire limit.
  bi_xns_min:        new BigInteger('-9000000000000000000'),// Json wire limit.
  bi_xns_unit:       new BigInteger('1000000'),

  cMinOffset:        -96,
  cMaxOffset:        80,

  // Maximum possible amount for non-XRP currencies using the maximum mantissa
  // with maximum exponent. Corresponds to hex 0xEC6386F26FC0FFFF.
  max_value:         '9999999999999999e80',
  // Minimum possible amount for non-XRP currencies.
  min_value:         '-1000000000000000e-96'
};

// Add constants to Amount class
extend(Amount, consts);

// DEPRECATED: Use Amount instead, e.g. Amount.currency_xns
exports.consts = consts;

// Given '100/USD/mtgox' return the a string with mtgox remapped.
Amount.text_full_rewrite = function(j) {
  return Amount.from_json(j).to_text_full();
};

// Given '100/USD/mtgox' return the json.
Amount.json_rewrite = function(j) {
  return Amount.from_json(j).to_json();
};

Amount.from_number = function(n) {
  return (new Amount()).parse_number(n);
};

Amount.from_json = function(j) {
  return (new Amount()).parse_json(j);
};

Amount.from_quality = function(quality, currency, issuer, opts) {
  return (new Amount()).parse_quality(quality, currency, issuer, opts);
};

Amount.from_human = function(j, opts) {
  return (new Amount()).parse_human(j, opts);
};

Amount.is_valid = function(j) {
  return Amount.from_json(j).is_valid();
};

Amount.is_valid_full = function(j) {
  return Amount.from_json(j).is_valid_full();
};

Amount.NaN = function() {
  var result = new Amount();
  result._value = NaN;
  return result;
};

// Returns a new value which is the absolute value of this.
Amount.prototype.abs = function() {
  return this.clone(this.is_negative());
};

// Result in terms of this' currency and issuer.
Amount.prototype.add = function(v) {
  var result;

  v = Amount.from_json(v);

  if (!this.is_comparable(v)) {
    result              = Amount.NaN();
  } else if (v.is_zero()) {
    result              = this;
  } else if (this.is_zero()) {
    result              = v.clone();
    result._is_native   = this._is_native;
    result._currency    = this._currency;
    result._issuer      = this._issuer;
  } else if (this._is_native) {
    result              = new Amount();

    var v1  = this._is_negative ? this._value.negate() : this._value;
    var v2  = v._is_negative ? v._value.negate() : v._value;
    var s   = v1.add(v2);

    result._is_negative = s.compareTo(BigInteger.ZERO) < 0;
    result._value       = result._is_negative ? s.negate() : s;
    result._currency    = this._currency;
    result._issuer      = this._issuer;
  } else {
    var v1  = this._is_negative ? this._value.negate() : this._value;
    var o1  = this._offset;
    var v2  = v._is_negative ? v._value.negate() : v._value;
    var o2  = v._offset;

    while (o1 < o2) {
      v1  = v1.divide(Amount.bi_10);
      o1  += 1;
    }

    while (o2 < o1) {
      v2  = v2.divide(Amount.bi_10);
      o2  += 1;
    }

    result = new Amount();
    result._is_native = false;
    result._offset = o1;
    result._value = v1.add(v2);
    result._is_negative = result._value.compareTo(BigInteger.ZERO) < 0;

    if (result._is_negative) {
      result._value = result._value.negate();
    }

    result._currency = this._currency;
    result._issuer = this._issuer;

    result.canonicalize();
  }

  return result;
};

// Result in terms of this currency and issuer.
Amount.prototype.subtract = function(v) {
  // Correctness over speed, less code has less bugs, reuse add code.
  return this.add(Amount.from_json(v).negate());
};

// Result in terms of this' currency and issuer.
// XXX Diverges from cpp.
Amount.prototype.multiply = function(v) {
  var result;

  v = Amount.from_json(v);

  if (this.is_zero()) {
    result = this;
  } else if (v.is_zero()) {
    result = this.clone();
    result._value = BigInteger.ZERO;
  } else {
    var v1 = this._value;
    var o1 = this._offset;
    var v2 = v._value;
    var o2 = v._offset;

    if (this.is_native()) {
      while (v1.compareTo(Amount.bi_man_min_value) < 0) {
        v1 = v1.multiply(Amount.bi_10);
        o1 -= 1;
      }
    }

    if (v.is_native()) {
      while (v2.compareTo(Amount.bi_man_min_value) < 0) {
        v2 = v2.multiply(Amount.bi_10);
        o2 -= 1;
      }
    }

    result              = new Amount();
    result._offset      = o1 + o2 + 14;
    result._value       = v1.multiply(v2).divide(Amount.bi_1e14).add(Amount.bi_7);
    result._is_native   = this._is_native;
    result._is_negative = this._is_negative !== v._is_negative;
    result._currency    = this._currency;
    result._issuer      = this._issuer;

    result.canonicalize();
  }

  return result;
};

// Result in terms of this' currency and issuer.
Amount.prototype.divide = function(d) {
  var result;

  d = Amount.from_json(d);

  if (d.is_zero()) {
    throw new Error('divide by zero');
  }

  if (this.is_zero()) {
    result = this;
  } else if (!this.is_valid()) {
    throw new Error('Invalid dividend');
  } else if (!d.is_valid()) {
    throw new Error('Invalid divisor');
  } else {
    var _n = this;

    if (_n.is_native()) {
      _n  = _n.clone();

      while (_n._value.compareTo(Amount.bi_man_min_value) < 0) {
        _n._value  = _n._value.multiply(Amount.bi_10);
        _n._offset -= 1;
      }
    }

    var _d = d;

    if (_d.is_native()) {
      _d = _d.clone();

      while (_d._value.compareTo(Amount.bi_man_min_value) < 0) {
        _d._value  = _d._value.multiply(Amount.bi_10);
        _d._offset -= 1;
      }
    }

    result              = new Amount();
    result._offset      = _n._offset - _d._offset - 17;
    result._value       = _n._value.multiply(Amount.bi_1e17).divide(_d._value).add(Amount.bi_5);
    result._is_native   = _n._is_native;
    result._is_negative = _n._is_negative !== _d._is_negative;
    result._currency    = _n._currency;
    result._issuer      = _n._issuer;

    result.canonicalize();
  }

  return result;
};

/**
 * This function calculates a ratio - such as a price - between two Amount
 * objects.
 *
 * The return value will have the same type (currency) as the numerator. This is
 * a simplification, which should be sane in most cases. For example, a USD/XRP
 * price would be rendered as USD.
 *
 * @example
 *   var price = buy_amount.ratio_human(sell_amount);
 *
 * @this {Amount} The numerator (top half) of the fraction.
 * @param {Amount} denominator The denominator (bottom half) of the fraction.
 * @param opts Options for the calculation.
 * @param opts.reference_date {Date|Number} Date based on which demurrage/interest
 *   should be applied. Can be given as JavaScript Date or int for Ripple epoch.
 * @return {Amount} The resulting ratio. Unit will be the same as numerator.
 */

Amount.prototype.ratio_human = function(denominator, opts) {
  opts = extend({ }, opts);

  var numerator = this;

  if (typeof denominator === 'number' && parseInt(denominator, 10) === denominator) {
    // Special handling of integer arguments
    denominator = Amount.from_json(String(denominator) + '.0');
  } else {
    denominator = Amount.from_json(denominator);
  }

  denominator = Amount.from_json(denominator);

  // If either operand is NaN, the result is NaN.
  if (!numerator.is_valid() || !denominator.is_valid()) {
    return Amount.NaN();
  }

  if (denominator.is_zero()) {
    return Amount.NaN();
  }

  // Apply interest/demurrage
  //
  // We only need to apply it to the second factor, because the currency unit of
  // the first factor will carry over into the result.
  if (opts.reference_date) {
    denominator = denominator.applyInterest(opts.reference_date);
  }

  // Special case: The denominator is a native (XRP) amount.
  //
  // In that case, it's going to be expressed as base units (1 XRP =
  // 10^xns_precision base units).
  //
  // However, the unit of the denominator is lost, so when the resulting ratio
  // is printed, the ratio is going to be too small by a factor of
  // 10^xns_precision.
  //
  // To compensate, we multiply the numerator by 10^xns_precision.
  if (denominator._is_native) {
    numerator = numerator.clone();
    numerator._value = numerator._value.multiply(Amount.bi_xns_unit);
    numerator.canonicalize();
  }

  return numerator.divide(denominator);
};

/**
 * Calculate a product of two amounts.
 *
 * This function allows you to calculate a product between two amounts which
 * retains XRPs human/external interpretation (i.e. 1 XRP = 1,000,000 base
 * units).
 *
 * Intended use is to calculate something like: 10 USD * 10 XRP/USD = 100 XRP
 *
 * @example
 *   var sell_amount = buy_amount.product_human(price);
 *
 * @see Amount#ratio_human
 *
 * @this {Amount} The first factor of the product.
 * @param {Amount} factor The second factor of the product.
 * @param opts Options for the calculation.
 * @param opts.reference_date {Date|Number} Date based on which demurrage/interest
 *   should be applied. Can be given as JavaScript Date or int for Ripple epoch.
 * @return {Amount} The product. Unit will be the same as the first factor.
 */
Amount.prototype.product_human = function(factor, opts) {
  opts = opts || {};

  if (typeof factor === 'number' && parseInt(factor, 10) === factor) {
    // Special handling of integer arguments
    factor = Amount.from_json(String(factor) + '.0');
  } else {
    factor = Amount.from_json(factor);
  }

  // If either operand is NaN, the result is NaN.
  if (!this.is_valid() || !factor.is_valid()) {
    return Amount.NaN();
  }

  // Apply interest/demurrage
  //
  // We only need to apply it to the second factor, because the currency unit of
  // the first factor will carry over into the result.
  if (opts.reference_date) {
    factor = factor.applyInterest(opts.reference_date);
  }

  var product = this.multiply(factor);

  // Special case: The second factor is a native (XRP) amount expressed as base
  // units (1 XRP = 10^xns_precision base units).
  //
  // See also Amount#ratio_human.
  if (factor._is_native) {
    product._value = product._value.divide(Amount.bi_xns_unit);
    product.canonicalize();
  }

  return product;
};

/**
 * Turn this amount into its inverse.
 *
 * @private
 */
Amount.prototype._invert = function() {
  this._value = Amount.bi_1e32.divide(this._value);
  this._offset = -32 - this._offset;
  this.canonicalize();

  return this;
};

/**
 * Return the inverse of this amount.
 *
 * @return {Amount} New Amount object with same currency and issuer, but the
 *   inverse of the value.
 */
Amount.prototype.invert = function() {
  return this.copy()._invert();
};

/**
 * Canonicalize amount value
 *
 * Mirrors rippled's internal Amount representation
 * From https://github.com/ripple/rippled/blob/develop/src/ripple/data/protocol/STAmount.h#L31-L40
 *
 * Internal form:
 * 1: If amount is zero, then value is zero and offset is -100
 * 2: Otherwise:
 *    legal offset range is -96 to +80 inclusive
 *    value range is 10^15 to (10^16 - 1) inclusive
 *    amount = value * [10 ^ offset]
 *
 * -------------------
 *
 * The amount can be epxresses as A x 10^B
 * Where:
 * - A must be an integer between 10^15 and (10^16)-1 inclusive
 * - B must be between -96 and 80 inclusive
 *
 * This results
 * - minumum: 10^15 x 10^-96 -> 10^-81 -> -1e-81
 * - maximum: (10^16)-1 x 10^80 -> 9999999999999999e80
 *
 * @returns {Amount}
 * @throws {Error} if offset exceeds legal ranges, meaning the amount value is bigger than supported
 */
Amount.prototype.canonicalize = function() {
  if (!(this._value instanceof BigInteger)) {
    // NaN.
    // nothing
  } else if (this._is_native) {
    // Native.
    if (this._value.equals(BigInteger.ZERO)) {
      this._offset      = 0;
      this._is_negative = false;
    } else {
      // Normalize _offset to 0.

      while (this._offset < 0) {
        this._value  = this._value.divide(Amount.bi_10);
        this._offset += 1;
      }

      while (this._offset > 0) {
        this._value  = this._value.multiply(Amount.bi_10);
        this._offset -= 1;
      }
    }

  } else if (this.is_zero()) {
    this._offset      = Amount.cMinOffset;
    this._is_negative = false;
  } else {
    // Normalize mantissa to valid range.

    while (this._value.compareTo(Amount.bi_man_min_value) < 0) {
      this._value  = this._value.multiply(Amount.bi_10);
      this._offset -= 1;
    }

    while (this._value.compareTo(Amount.bi_man_max_value) > 0) {
      this._value  = this._value.divide(Amount.bi_10);
      this._offset += 1;
    }
  }

  // Make sure not bigger than supported. Throw if so.
  if (this.is_negative() && this._offset < Amount.cMinOffset) {
    throw new Error('Exceeding min value of ' + Amount.min_value);
  }

  // Make sure not smaller than supported. Throw if so.
  if (!this.is_negative() && this._offset > Amount.cMaxOffset) {
    throw new Error('Exceeding max value of ' + Amount.max_value);
  }

  return this;
};

Amount.prototype.clone = function(negate) {
  return this.copyTo(new Amount(), negate);
};

Amount.prototype.compareTo = function(v) {
  var result;

  v = Amount.from_json(v);

  if (!this.is_comparable(v)) {
    result  = Amount.NaN();
  } else if (this._is_negative !== v._is_negative) {
    // Different sign.
    result  = this._is_negative ? -1 : 1;
  } else if (this._value.equals(BigInteger.ZERO)) {
    // Same sign: positive.
    result  = v._value.equals(BigInteger.ZERO) ? 0 : -1;
  } else if (v._value.equals(BigInteger.ZERO)) {
    // Same sign: positive.
    result  = 1;
  } else if (!this._is_native && this._offset > v._offset) {
    result  = this._is_negative ? -1 : 1;
  } else if (!this._is_native && this._offset < v._offset) {
    result  = this._is_negative ? 1 : -1;
  } else {
    result  = this._value.compareTo(v._value);
    if (result > 0) {
      result  = this._is_negative ? -1 : 1;
    } else if (result < 0) {
      result  = this._is_negative ? 1 : -1;
    }
  }

  return result;
};

// Make d a copy of this. Returns d.
// Modification of objects internally refered to is not allowed.
Amount.prototype.copyTo = function(d, negate) {
  if (typeof this._value === 'object') {
    this._value.copyTo(d._value);
  } else {
    d._value   = this._value;
  }

  d._offset = this._offset;
  d._is_native = this._is_native;
  d._is_negative  = negate
    ? !this._is_negative    // Negating.
    : this._is_negative;    // Just copying.

  d._currency     = this._currency;
  d._issuer       = this._issuer;

  // Prevent negative zero
  if (d.is_zero()) {
    d._is_negative = false;
  }

  return d;
};

Amount.prototype.currency = function() {
  return this._currency;
};

Amount.prototype.equals = function(d, ignore_issuer) {
  if (typeof d === 'string') {
    return this.equals(Amount.from_json(d));
  }

  var result = !((!this.is_valid() || !d.is_valid())
             || (this._is_native !== d._is_native)
             || (!this._value.equals(d._value) || this._offset !== d._offset)
             || (this._is_negative !== d._is_negative)
             || (!this._is_native && (!this._currency.equals(d._currency) || !ignore_issuer && !this._issuer.equals(d._issuer))));

  return result;
};

// True if Amounts are valid and both native or non-native.
Amount.prototype.is_comparable = function(v) {
  return this._value instanceof BigInteger
    && v._value instanceof BigInteger
    && this._is_native === v._is_native;
};

Amount.prototype.is_native = function() {
  return this._is_native;
};

Amount.prototype.is_negative = function() {
  return this._value instanceof BigInteger
          ? this._is_negative
          : false;                          // NaN is not negative
};

Amount.prototype.is_positive = function() {
  return !this.is_zero() && !this.is_negative();
};

// Only checks the value. Not the currency and issuer.
Amount.prototype.is_valid = function() {
  return this._value instanceof BigInteger;
};

Amount.prototype.is_valid_full = function() {
  return this.is_valid() && this._currency.is_valid() && this._issuer.is_valid();
};

Amount.prototype.is_zero = function() {
  return this._value instanceof BigInteger ? this._value.equals(BigInteger.ZERO) : false;
};

Amount.prototype.issuer = function() {
  return this._issuer;
};

// Return a new value.
Amount.prototype.negate = function() {
  return this.clone('NEGATE');
};

/**
 * Invert this amount and return the new value.
 *
 * Creates a new Amount object as a copy of the current one (including the same
 * unit (currency & issuer), inverts it (1/x) and returns the result.
 */
Amount.prototype.invert = function() {
  var one          = this.clone();
  one._value       = BigInteger.ONE;
  one._offset      = 0;
  one._is_negative = false;

  one.canonicalize();

  return one.ratio_human(this);
};

/**
 * Tries to correctly interpret an amount as entered by a user.
 *
 * Examples:
 *
 *   XRP 250     => 250000000/XRP
 *   25.2 XRP    => 25200000/XRP
 *   USD 100.40  => 100.4/USD/?
 *   100         => 100000000/XRP
 *
 *
 * The regular expression below matches above cases, broken down for better understanding:
 *
 * ^\s*                         // start with any amount of whitespace
 * ([A-z]{3}|[0-9]{3})          // either 3 letter alphabetic currency-code or 3 digit numeric currency-code. See ISO 4217
 * \s*                          // any amount of whitespace
 * (-)?                         // optional dash
 * (\d+)                        // 1 or more digits
 * (?:\.(\d*))?                 // optional . character with any amount of digits
 * \s*                          // any amount of whitespace
 * ([A-z]{3}|[0-9]{3})?         // either 3 letter alphabetic currency-code or 3 digit numeric currency-code. See ISO 4217
 * \s*                          // any amount of whitespace
 * $                            // end of string
 *
 */
Amount.human_RE_hex = /^\s*(-)?(\d+)(?:\.(\d*))?\s*([a-fA-F0-9]{40})\s*$/;
Amount.human_RE = /^\s*([A-z]{3}|[0-9]{3})?\s*(-)?(\d+)(?:\.(\d*))?\s*([A-z]{3}|[0-9]{3})?\s*$/;

Amount.prototype.parse_human = function(j, opts) {
  opts = opts || {};

  var integer;
  var fraction;
  var currency;
  var precision  = null;

  // first check if it's a hex formatted currency
  var matches = String(j).match(Amount.human_RE_hex);
  if (matches && matches.length === 5 && matches[4]) {
    integer  = matches[2];
    fraction = matches[3] || '';
    currency = matches[4];
    this._is_negative = Boolean(matches[1]);
  }

  if (integer === void(0) && currency === void(0)) {
    var m = String(j).match(Amount.human_RE);
    if (m) {
      currency = m[5] || m[1] || 'XRP';
      integer = m[5] && m[1] ? m[1] + '' + m[3] : (m[3] || '0');
      fraction = m[4] || '';
      this._is_negative = Boolean(m[2]);
    }
  }

  if (integer) {
    currency = currency.toUpperCase();

    this._value = new BigInteger(integer);
    this.set_currency(currency);

    // XRP have exactly six digits of precision
    if (currency === 'XRP') {
      fraction = fraction.slice(0, 6);
      while (fraction.length < 6) {
        fraction += '0';
      }
      this._is_native = true;
      this._value     = this._value.multiply(Amount.bi_xns_unit).add(new BigInteger(fraction));
    } else {
      // Other currencies have arbitrary precision
      fraction  = fraction.replace(/0+$/, '');
      precision = fraction.length;

      this._is_native = false;
      var multiplier  = Amount.bi_10.clone().pow(precision);
      this._value     = this._value.multiply(multiplier).add(new BigInteger(fraction));
      this._offset    = -precision;

      this.canonicalize();
    }

    // Apply interest/demurrage
    if (opts.reference_date && this._currency.has_interest()) {
      var interest = this._currency.get_interest_at(opts.reference_date);

      // XXX Because the Amount parsing routines don't support some of the things
      //     that JavaScript can output when casting a float to a string, the
      //     following call sometimes does not produce a valid Amount.
      //
      //     The correct way to solve this is probably to switch to a proper
      //     BigDecimal for our internal representation and then use that across
      //     the board instead of instantiating these dummy Amount objects.
      var interestTempAmount = Amount.from_json(''+interest+'/1/1');

      if (interestTempAmount.is_valid()) {
        var ref = this.divide(interestTempAmount);
        this._value = ref._value;
        this._offset = ref._offset;
      }
    }
  } else {
    this._value = NaN;
  }

  return this;
};

Amount.prototype.parse_issuer = function(issuer) {
  this._issuer  = UInt160.from_json(issuer);

  return this;
};

/**
 * Decode a price from a BookDirectory index.
 *
 * BookDirectory ledger entries each encode the offer price in their index. This
 * method can decode that information and populate an Amount object with it.
 *
 * It is possible not to provide a currency or issuer, but be aware that Amount
 * objects behave differently based on the currency, so you may get incorrect
 * results.
 *
 * Prices involving demurraging currencies are tricky, since they depend on the
 * base and counter currencies.
 *
 * @param quality {String} 8 hex bytes quality or 32 hex bytes BookDirectory
 *   index.
 * @param counterCurrency {Currency|String} Currency of the resulting Amount
 *   object.
 * @param counterIssuer {Issuer|String} Issuer of the resulting Amount object.
 * @param opts Additional options
 * @param opts.inverse {Boolean} If true, return the inverse of the price
 *   encoded in the quality.
 * @param opts.base_currency {Currency|String} The other currency. This plays a
 *   role with interest-bearing or demurrage currencies. In that case the
 *   demurrage has to be applied when the quality is decoded, otherwise the
 *   price will be false.
 * @param opts.reference_date {Date|Number} Date based on which demurrage/interest
 *   should be applied. Can be given as JavaScript Date or int for Ripple epoch.
 * @param opts.xrp_as_drops {Boolean} Whether XRP amount should be treated as
 *   drops. When the base currency is XRP, the quality is calculated in drops.
 *   For human use however, we want to think of 1000000 drops as 1 XRP and
 *   prices as per-XRP instead of per-drop.
 */
Amount.prototype.parse_quality = function(quality, counterCurrency, counterIssuer, opts)
{
  opts = opts || {};

  var baseCurrency = Currency.from_json(opts.base_currency);

  this._is_negative = false;
  this._value       = new BigInteger(quality.substring(quality.length-14), 16);
  this._offset      = parseInt(quality.substring(quality.length-16, quality.length-14), 16)-100;
  this._currency    = Currency.from_json(counterCurrency);
  this._issuer      = UInt160.from_json(counterIssuer);
  this._is_native   = this._currency.is_native();

  // Correct offset if xrp_as_drops option is not set and base currency is XRP
  if (!opts.xrp_as_drops &&
      baseCurrency.is_valid() &&
      baseCurrency.is_native()) {
    if (opts.inverse) {
      this._offset -= 6;
    } else {
      this._offset += 6;
    }
  }

  if (opts.inverse) {
    this._invert();
  }

  this.canonicalize();

  if (opts.reference_date && baseCurrency.is_valid() && baseCurrency.has_interest()) {
    var interest = baseCurrency.get_interest_at(opts.reference_date);

    // XXX If we had better math utilities, we wouldn't need this hack.
    var interestTempAmount = Amount.from_json(''+interest+'/1/1');

    if (interestTempAmount.is_valid()) {
      var v = this.divide(interestTempAmount);
      this._value = v._value;
      this._offset = v._offset;
    }
  }

  return this;
};

Amount.prototype.parse_number = function(n) {
  this._is_native   = false;
  this._currency    = Currency.from_json(1);
  this._issuer      = UInt160.from_json(1);
  this._is_negative = n < 0 ? true : false;
  this._value       = new BigInteger(String(this._is_negative ? -n : n));
  this._offset      = 0;

  this.canonicalize();

  return this;
};

// <-> j
Amount.prototype.parse_json = function(j) {
  switch (typeof j) {
    case 'string':
      // .../.../... notation is not a wire format.  But allowed for easier testing.
      var m = j.match(/^([^/]+)\/([^/]+)(?:\/(.+))?$/);

      if (m) {
        this._currency  = Currency.from_json(m[2]);
        if (m[3]) {
          this._issuer  = UInt160.from_json(m[3]);
        } else {
          this._issuer  = UInt160.from_json('1');
        }
        this.parse_value(m[1]);
      } else {
        this.parse_native(j);
        this._currency  = Currency.from_json('0');
        this._issuer    = UInt160.from_json('0');
      }
      break;

    case 'number':
      this.parse_json(String(j));
      break;

    case 'object':
      if (j === null) {
        break;
      }

      if (j instanceof Amount) {
        j.copyTo(this);
      } else if (j.hasOwnProperty('value')) {
        // Parse the passed value to sanitize and copy it.
        this._currency.parse_json(j.currency, true); // Never XRP.

        if (typeof j.issuer === 'string') {
          this._issuer.parse_json(j.issuer);
        }

        this.parse_value(j.value);
      }
      break;

    default:
      this._value = NaN;
  }

  return this;
};

// Parse a XRP value from untrusted input.
// - integer = raw units
// - float = with precision 6
// XXX Improvements: disallow leading zeros.
Amount.prototype.parse_native = function(j) {
  var m;

  if (typeof j === 'string') {
    m = j.match(/^(-?)(\d*)(\.\d{0,6})?$/);
  }

  if (m) {
    if (m[3] === void(0)) {
      // Integer notation
      this._value = new BigInteger(m[2]);
    } else {
      // Float notation : values multiplied by 1,000,000.
      var int_part      = (new BigInteger(m[2])).multiply(Amount.bi_xns_unit);
      var fraction_part = (new BigInteger(m[3])).multiply(new BigInteger(String(Math.pow(10, 1+Amount.xns_precision-m[3].length))));

      this._value = int_part.add(fraction_part);
    }

    this._is_native   = true;
    this._offset      = 0;
    this._is_negative = !!m[1] && this._value.compareTo(BigInteger.ZERO) !== 0;

    if (this._value.compareTo(Amount.bi_xns_max) > 0) {
      this._value = NaN;
    }
  } else {
    this._value = NaN;
  }

  return this;
};

// Parse a non-native value for the json wire format.
// Requires _currency to be set!
Amount.prototype.parse_value = function(j) {
  this._is_native    = false;

  switch (typeof j) {
    case 'number':
      this._is_negative = j < 0;
      this._value       = new BigInteger(Math.abs(j));
      this._offset      = 0;

      this.canonicalize();
      break;

    case 'string':
      var i = j.match(/^(-?)(\d+)$/);
      var d = !i && j.match(/^(-?)(\d*)\.(\d*)$/);
      var e = !e && j.match(/^(-?)(\d*)e(-?\d+)$/);

      if (e) {
        // e notation
        this._value       = new BigInteger(e[2]);
        this._offset      = parseInt(e[3]);
        this._is_negative = !!e[1];

        this.canonicalize();
      } else if (d) {
        // float notation
        var integer   = new BigInteger(d[2]);
        var fraction  = new BigInteger(d[3]);
        var precision = d[3].length;

        this._value       = integer.multiply(Amount.bi_10.clone().pow(precision)).add(fraction);
        this._offset      = -precision;
        this._is_negative = !!d[1];

        this.canonicalize();
      } else if (i) {
        // integer notation
        this._value       = new BigInteger(i[2]);
        this._offset      = 0;
        this._is_negative = !!i[1];

        this.canonicalize();
      } else {
        this._value = NaN;
      }
      break;

    default:
      this._value = j instanceof BigInteger ? j : NaN;
  }

  return this;
};

Amount.prototype.set_currency = function(c) {
  this._currency  = Currency.from_json(c);
  this._is_native = this._currency.is_native();

  return this;
};

Amount.prototype.set_issuer = function(issuer) {
  if (issuer instanceof UInt160) {
    this._issuer  = issuer;
  } else {
    this._issuer  = UInt160.from_json(issuer);
  }

  return this;
};

Amount.prototype.to_number = function(allow_nan) {
  var s = this.to_text(allow_nan);
  return typeof s === 'string' ? Number(s) : s;
};

// Convert only value to JSON wire format.
Amount.prototype.to_text = function(allow_nan) {
  var result = NaN;

  if (this._is_native) {
    if (this.is_valid() && this._value.compareTo(Amount.bi_xns_max) <= 0){
      result = this._value.toString();
    }
  } else if (this.is_zero()) {
    result = '0';
  } else if (this._offset && (this._offset < -25 || this._offset > -4)) {
    // Use e notation.
    // XXX Clamp output.
    result = this._value.toString() + 'e' + this._offset;
  } else {
    var val    = '000000000000000000000000000' + this._value.toString() + '00000000000000000000000';
    var pre    = val.substring(0, this._offset + 43);
    var post   = val.substring(this._offset + 43);
    var s_pre  = pre.match(/[1-9].*$/);  // Everything but leading zeros.
    var s_post = post.match(/[1-9]0*$/); // Last non-zero plus trailing zeros.

    result = ''
      + (s_pre ? s_pre[0] : '0')
      + (s_post ? '.' + post.substring(0, 1 + post.length - s_post[0].length) : '');
  }

  if (!allow_nan && typeof result === 'number' && isNaN(result)) {
    result = '0';
  } else if (this._is_negative) {
    result = '-' + result;
  }

  return result;
};

/**
 * Calculate present value based on currency and a reference date.
 *
 * This only affects demurraging and interest-bearing currencies.
 *
 * User should not store amount objects after the interest is applied. This is
 * intended by display functions such as toHuman().
 *
 * @param referenceDate {Date|Number} Date based on which demurrage/interest
 *   should be applied. Can be given as JavaScript Date or int for Ripple epoch.
 * @return {Amount} The amount with interest applied.
 */
Amount.prototype.applyInterest = function(referenceDate) {
  if (this._currency.has_interest()) {
    var interest = this._currency.get_interest_at(referenceDate);

    // XXX Because the Amount parsing routines don't support some of the things
    //     that JavaScript can output when casting a float to a string, the
    //     following call sometimes does not produce a valid Amount.
    //
    //     The correct way to solve this is probably to switch to a proper
    //     BigDecimal for our internal representation and then use that across
    //     the board instead of instantiating these dummy Amount objects.
    var interestTempAmount = Amount.from_json(String(interest) + '/1/1');

    if (interestTempAmount.is_valid()) {
      return this.multiply(interestTempAmount);
    }
  } else {
    return this;
  }
};

/**
 * Format only value in a human-readable format.
 *
 * @example
 *   var pretty = amount.to_human({precision: 2});
 *
 * @param opts Options for formatter.
 * @param opts.precision {Number} Max. number of digits after decimal point.
 * @param opts.min_precision {Number} Min. number of digits after dec. point.
 * @param opts.skip_empty_fraction {Boolean} Don't show fraction if it is zero,
 *   even if min_precision is set.
 * @param opts.max_sig_digits {Number} Maximum number of significant digits.
 *   Will cut fractional part, but never integer part.
 * @param opts.group_sep {Boolean|String} Whether to show a separator every n
 *   digits, if a string, that value will be used as the separator. Default: ','
 * @param opts.group_width {Number} How many numbers will be grouped together,
 *   default: 3.
 * @param opts.signed {Boolean|String} Whether negative numbers will have a
 *   prefix. If String, that string will be used as the prefix. Default: '-'
 * @param opts.reference_date {Date|Number} Date based on which demurrage/interest
 *   should be applied. Can be given as JavaScript Date or int for Ripple epoch.
 */
Amount.prototype.to_human = function(opts) {
  opts = opts || {};

  if (!this.is_valid()) {
    return '';
  }

  // Default options
  if (typeof opts.signed === 'undefined') {
    opts.signed = true;
  }
  if (typeof opts.group_sep === 'undefined') {
    opts.group_sep = true;
  }

  opts.group_width = opts.group_width || 3;

  // Apply demurrage/interest
  var ref = this;
  if (opts.reference_date) {
    ref = this.applyInterest(opts.reference_date);
  }

  var order         = ref._is_native ? Amount.xns_precision : -ref._offset;
  var denominator   = Amount.bi_10.clone().pow(order);
  var int_part      = ref._value.divide(denominator).toString();
  var fraction_part = ref._value.mod(denominator).toString();

  // Add leading zeros to fraction
  while (fraction_part.length < order) {
    fraction_part = '0' + fraction_part;
  }

  int_part = int_part.replace(/^0*/, '');
  fraction_part = fraction_part.replace(/0*$/, '');

  if (fraction_part.length || !opts.skip_empty_fraction) {
    // Enforce the maximum number of decimal digits (precision)
    if (typeof opts.precision === 'number') {
      var precision = Math.max(0, opts.precision);
      precision = Math.min(precision, fraction_part.length);
      var rounded = Number('0.' + fraction_part).toFixed(precision);

      if (rounded < 1) {
        fraction_part = rounded.substring(2);
      } else {
        int_part = (Number(int_part) + 1).toString();
        fraction_part = '';
      }

      while (fraction_part.length < precision) {
        fraction_part = '0' + fraction_part;
      }
    }

    // Limit the number of significant digits (max_sig_digits)
    if (typeof opts.max_sig_digits === 'number') {
      // First, we count the significant digits we have.
      // A zero in the integer part does not count.
      var int_is_zero = Number(int_part) === 0;
      var digits = int_is_zero ? 0 : int_part.length;

      // Don't count leading zeros in the fractional part if the integer part is
      // zero.
      var sig_frac = int_is_zero ? fraction_part.replace(/^0*/, '') : fraction_part;
      digits += sig_frac.length;

      // Now we calculate where we are compared to the maximum
      var rounding = digits - opts.max_sig_digits;

      // If we're under the maximum we want to cut no (=0) digits
      rounding = Math.max(rounding, 0);

      // If we're over the maximum we still only want to cut digits from the
      // fractional part, not from the integer part.
      rounding = Math.min(rounding, fraction_part.length);

      // Now we cut `rounding` digits off the right.
      if (rounding > 0) {
        fraction_part = fraction_part.slice(0, -rounding);
      }
    }

    // Enforce the minimum number of decimal digits (min_precision)
    if (typeof opts.min_precision === 'number') {
      opts.min_precision = Math.max(0, opts.min_precision);
      while (fraction_part.length < opts.min_precision) {
        fraction_part += '0';
      }
    }
  }

  if (opts.group_sep) {
    if (typeof opts.group_sep !== 'string') {
      opts.group_sep = ',';
    }
    int_part = utils.chunkString(int_part, opts.group_width, true).join(opts.group_sep);
  }

  var formatted = '';
  if (opts.signed && this._is_negative) {
    if (typeof opts.signed !== 'string') {
      opts.signed = '-';
    }
    formatted += opts.signed;
  }

  formatted += int_part.length ? int_part : '0';
  formatted += fraction_part.length ? '.' + fraction_part : '';

  return formatted;
};

Amount.prototype.to_human_full = function(opts) {
  opts = opts || {};
  var a = this.to_human(opts);
  var c = this._currency.to_human();
  var i = this._issuer.to_json(opts);
  var o = this.is_native() ?  (o = a + '/' + c) : (o  = a + '/' + c + '/' + i);
  return o;
};

Amount.prototype.to_json = function() {
  var result;

  if (this._is_native) {
    result = this.to_text();
  } else {
    var amount_json = {
      value : this.to_text(),
      currency : this._currency.has_interest() ? this._currency.to_hex() : this._currency.to_json()
    };
    if (this._issuer.is_valid()) {
      amount_json.issuer = this._issuer.to_json();
    }
    result = amount_json;
  }

  return result;
};

Amount.prototype.to_text_full = function(opts) {
  return this._value instanceof BigInteger
    ? this._is_native
      ? this.to_human() + '/XRP'
      : this.to_text() + '/' + this._currency.to_json() + '/' + this._issuer.to_json(opts)
    : NaN;
};

// For debugging.
Amount.prototype.not_equals_why = function(d, ignore_issuer) {
  if (typeof d === 'string') {
    return this.not_equals_why(Amount.from_json(d));
  }

  if (!(d instanceof Amount)) {
    return 'Not an Amount';
  }

  var result = false;

  if (!this.is_valid() || !d.is_valid()) {
    result = 'Invalid amount.';
  } else if (this._is_native !== d._is_native) {
    result = 'Native mismatch.';
  } else {
    var type = this._is_native ? 'XRP' : 'Non-XRP';

    if (!this._value.equals(d._value) || this._offset !== d._offset) {
      result = type + ' value differs.';
    } else if (this._is_negative !== d._is_negative) {
      result = type + ' sign differs.';
    } else if (!this._is_native) {
      if (!this._currency.equals(d._currency)) {
        result = 'Non-XRP currency differs.';
      } else if (!ignore_issuer && !this._issuer.equals(d._issuer)) {
        result = 'Non-XRP issuer differs: ' + d._issuer.to_json() + '/' + this._issuer.to_json();
      }
    }
  }

  return result;
};

exports.Amount   = Amount;

// DEPRECATED: Include the corresponding files instead.
exports.Currency = Currency;
exports.Seed     = Seed;
exports.UInt160  = UInt160;

// vim:sw=2:sts=2:ts=8:et
