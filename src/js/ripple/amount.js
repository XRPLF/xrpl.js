// Represent Ripple amounts and currencies.
// - Numbers in hex are big-endian.

var assert    = require('assert');
var extend    = require('extend');
var utils     = require('./utils');
var UInt160   = require('./uint160').UInt160;
var Seed      = require('./seed').Seed;
var Currency  = require('./currency').Currency;
var BigNumber = require('./bignumber');

function Amount() {
  // Json format:
  //  integer : XRP
  //  { 'value' : ..., 'currency' : ..., 'issuer' : ...}

  this._value       = new BigNumber(NaN);
  this._is_native   = true; // Default to XRP. Only valid if value is not NaN.
  this._currency    = new Currency();
  this._issuer      = new UInt160();
}

var consts = {
  currency_xns:      0,
  currency_one:      1,
  xns_precision:     6,

  // bi_ prefix refers to "big integer"
  bi_5:              new BigNumber('5'),
  bi_7:              new BigNumber('7'),
  bi_10:             new BigNumber('10'),
  bi_1e14:           new BigNumber(String(1e14)),
  bi_1e16:           new BigNumber(String(1e16)),
  bi_1e17:           new BigNumber(String(1e17)),
  bi_1e32:           new BigNumber('100000000000000000000000000000000'),
  bi_man_max_value:  new BigNumber('9999999999999999'),
  bi_man_min_value:  new BigNumber('1000000000000000'),
  bi_xns_max:        new BigNumber('9000000000000000000'), // Json wire limit.
  bi_xns_min:        new BigNumber('-9000000000000000000'),// Json wire limit.
  bi_xrp_max:        new BigNumber('9000000000000'),
  bi_xrp_min:        new BigNumber('-9000000000000'),
  bi_xns_unit:       new BigNumber('1000000'),

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
  result._value = new BigNumber(NaN); // should have no effect
  return result;                      // but let's be careful
};

// be sure that _is_native is set properly BEFORE calling _set_value
Amount.prototype._set_value = function(value, roundingMode) {
  assert(value instanceof BigNumber);
  this._value = value.isZero() && value.isNegative() ? value.negated() : value;
  this.canonicalize(roundingMode);
  this._check_limits();
};

// Returns a new value which is the absolute value of this.
Amount.prototype.abs = function() {
  return this.clone(this.is_negative());
};

Amount.prototype.add = function(addend) {
  var addendAmount = Amount.from_json(addend);

  if (!this.is_comparable(addendAmount)) {
    return Amount.NaN();
  }

  return this._copy(this._value.plus(addendAmount._value));
};

Amount.prototype.subtract = function(subtrahend) {
  // Correctness over speed, less code has less bugs, reuse add code.
  return this.add(Amount.from_json(subtrahend).negate());
};

// XXX Diverges from cpp.
Amount.prototype.multiply = function(multiplicand) {
  var multiplicandAmount = Amount.from_json(multiplicand);
  // TODO: probably should just multiply by multiplicandAmount._value
  var multiplyBy = multiplicandAmount.is_native() ?
    multiplicandAmount._value.times(Amount.bi_xns_unit)
    : multiplicandAmount._value;
  return this._copy(this._value.times(multiplyBy));
};

Amount.prototype.divide = function(divisor) {
  var divisorAmount = Amount.from_json(divisor);
  if (!this.is_valid()) {
    throw new Error('Invalid dividend');
  }
  if (!divisorAmount.is_valid()) {
    throw new Error('Invalid divisor');
  }
  if (divisorAmount.is_zero()) {
    throw new Error('divide by zero');
  }
  // TODO: probably should just divide by divisorAmount._value
  var divideBy = divisorAmount.is_native() ?
    divisorAmount._value.times(Amount.bi_xns_unit)
    : divisorAmount._value;
  return this._copy(this._value.dividedBy(divideBy));
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
    numerator._set_value(numerator._value.times(Amount.bi_xns_unit));
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
    product._set_value(product._value.dividedBy(Amount.bi_xns_unit));
  }

  return product;
};

/**
 * Turn this amount into its inverse.
 *
 * @private
 */
Amount.prototype._invert = function() {
  this._set_value((new BigNumber(1)).dividedBy(this._value));
  return this;
};

/**
 * Return the inverse of this amount.
 *
 * @return {Amount} New Amount object with same currency and issuer, but the
 *   inverse of the value.
 */
Amount.prototype.invert = function() {
  return this.clone()._invert();
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

Amount.prototype.canonicalize = function(roundingMode) {
  if (this._is_native) {
    this._value = this._value.round(6, BigNumber.ROUND_DOWN);
  } else {
    if (roundingMode) {
      var value = this._value;
      this._value = BigNumber.withRoundingMode(roundingMode, function() {
        return new BigNumber(value.toPrecision(16));
      });
    } else {
      this._value = new BigNumber(this._value.toPrecision(16));
    }
  }
};

Amount.prototype._check_limits = function() {
  if (this._value.isNaN() || this._value.isZero()) {
    return this;
  }
  if (!this._is_native) {
    var absval = this._value.absoluteValue();
    if (absval.lessThan((new BigNumber(Amount.min_value)).absoluteValue())) {
      throw new Error('Exceeding min value of ' + Amount.min_value);
    }
    if (absval.greaterThan(new BigNumber(Amount.max_value))) {
      throw new Error('Exceeding max value of ' + Amount.max_value);
    }
  }
  return this;
};

Amount.prototype.clone = function(negate) {
  return this.copyTo(new Amount(), negate);
};

Amount.prototype._copy = function(value) {
  var copy = this.clone();
  copy._set_value(value);
  return copy;
};

Amount.prototype.compareTo = function(to) {
  var toAmount = Amount.from_json(to);
  if (!this.is_comparable(toAmount)) {
    return Amount.NaN();
  }
  return this._value.comparedTo(toAmount._value);
};

// Make d a copy of this. Returns d.
// Modification of objects internally refered to is not allowed.
Amount.prototype.copyTo = function(d, negate) {
  d._value     = negate ? this._value.negated() : this._value;
  d._is_native = this._is_native;
  d._currency  = this._currency;
  d._issuer    = this._issuer;
  return d;
};

Amount.prototype.currency = function() {
  return this._currency;
};

Amount.prototype.equals = function(d, ignore_issuer) {
  if (typeof d === 'string') {
    return this.equals(Amount.from_json(d));
  }

  return this.is_valid() && d.is_valid()
         && this._is_native === d._is_native
         && this._value.equals(d._value)
         && (this._is_native || (this._currency.equals(d._currency)
              && (ignore_issuer || this._issuer.equals(d._issuer))));
};

// True if Amounts are valid and both native or non-native.
Amount.prototype.is_comparable = function(v) {
  return this.is_valid() && v.is_valid() && this._is_native === v._is_native;
};

Amount.prototype.is_native = function() {
  return this._is_native;
};

Amount.prototype.is_negative = function() {
  return this._value.isNegative();
};

Amount.prototype.is_positive = function() {
  return !this.is_zero() && !this.is_negative();
};

// Only checks the value. Not the currency and issuer.
Amount.prototype.is_valid = function() {
  return !this._value.isNaN();
};

Amount.prototype.is_valid_full = function() {
  return this.is_valid() && this._currency.is_valid() && this._issuer.is_valid();
};

Amount.prototype.is_zero = function() {
  return this._value.isZero();
};

Amount.prototype.issuer = function() {
  return this._issuer;
};

// Return a new value.
Amount.prototype.negate = function() {
  return this.clone('NEGATE');
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
 * ([A-z]{3}|[0-9]{3})          // either 3 letter alphabetic currency-code or 3 digit numeric currency-code. See ISO 4217
 * $                            // end of string
 *
 */

Amount.prototype.parse_human = function(j, opts) {
  opts = opts || {};

  var hex_RE = /^[a-fA-F0-9]{40}$/;
  var currency_RE = /^([a-zA-Z]{3}|[0-9]{3})$/;

  var value;
  var currency;

  var words = j.split(' ').filter(function(word) { return word !== ''; });

  if (words.length === 1) {
    if (isFinite(words[0])) {
      value = words[0];
      currency = 'XRP';
    } else {
      value = words[0].slice(0, -3);
      currency = words[0].slice(-3);
      if (!(isFinite(value) && currency.match(currency_RE))) {
        return Amount.NaN();
      }
    }
  } else if (words.length === 2) {
    if (isFinite(words[0]) && words[1].match(hex_RE)) {
      value = words[0];
      currency = words[1];
    } else if (words[0].match(currency_RE) && isFinite(words[1])) {
      value = words[1];
      currency = words[0];
    } else if (isFinite(words[0]) && words[1].match(currency_RE)) {
      value = words[0];
      currency = words[1];
    } else {
      return Amount.NaN();
    }
  } else {
    return Amount.NaN();
  }

  currency = currency.toUpperCase();
  this.set_currency(currency);
  this._is_native = (currency === 'XRP');
  this._set_value(new BigNumber(value));

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
      this._set_value(this.divide(interestTempAmount)._value);
    }
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

  var mantissa_hex  = quality.substring(quality.length-14);
  var offset_hex    = quality.substring(quality.length-16, quality.length-14);
  var mantissa      = new BigNumber(mantissa_hex, 16);
  var offset        = parseInt(offset_hex, 16) - 100;

  var value = new BigNumber(mantissa.toString() + 'e' + offset.toString());

  this._currency    = Currency.from_json(counterCurrency);
  this._issuer      = UInt160.from_json(counterIssuer);
  this._is_native   = this._currency.is_native();

  var power = 0;
  if (this._is_native) {
    if (opts.inverse) {
      power += 1;
    } else {
      power -= 1;
    }
  }

  // Correct offset if xrp_as_drops option is not set and base currency is XRP
  if (!opts.xrp_as_drops &&
      baseCurrency.is_valid() &&
      baseCurrency.is_native()) {
    if (opts.inverse) {
      power -= 1;
    } else {
      power += 1;
    }
  }

  var one = new BigNumber(1);
  var adjusted = value.times(Amount.bi_xns_unit.toPower(power));
  var newValue = opts.inverse ? one.dividedBy(adjusted) : adjusted;
  this._set_value(newValue);

  if (opts.reference_date && baseCurrency.is_valid() && baseCurrency.has_interest()) {
    var interest = baseCurrency.get_interest_at(opts.reference_date);

    // XXX If we had better math utilities, we wouldn't need this hack.
    var interestTempAmount = Amount.from_json(''+interest+'/1/1');

    if (interestTempAmount.is_valid()) {
      this._set_value(this.divide(interestTempAmount)._value);
    }
  }

  return this;
};

Amount.prototype.parse_number = function(n) {
  this._is_native   = false;
  this._currency    = Currency.from_json(1);
  this._issuer      = UInt160.from_json(1);
  this._set_value(new BigNumber(n));
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
      this._set_value(new BigNumber(NaN));
  }

  return this;
};

// Parse a XRP value from untrusted input.
// - integer = raw units
// - float = with precision 6
// XXX Improvements: disallow leading zeros.
Amount.prototype.parse_native = function(j) {
  if (typeof j === 'string' && j.match(/^-?\d*(\.\d{0,6})?$/)) {
    var value = new BigNumber(j);
    this._is_native = true;
    if (j.indexOf('.') >= 0) {
      this._set_value(value);
    } else {
      this._set_value(value.dividedBy(Amount.bi_xns_unit));
    }
    // TODO: move this overflow check to canonicalize
    if (this._value.abs().greaterThan(Amount.bi_xrp_max)) {
      this._set_value(new BigNumber(NaN));
    }
  } else {
    this._set_value(new BigNumber(NaN));
  }

  return this;
};

// Parse a non-native value for the json wire format.
// Requires _currency to be set!
Amount.prototype.parse_value = function(j) {
  this._is_native = false;
  this._set_value(new BigNumber(j), BigNumber.ROUND_DOWN);
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
  if (this._is_native && this._value.abs().greaterThan(Amount.bi_xrp_max)) {
    return '0';
  }
  if (this._value.isNaN() && !allow_nan) {
    return '0';
  } else if (this._value.isNaN()) {
    return NaN;   // TODO: why does to_text return NaN? return 'NaN'?
  }

  if (this._is_native) {
    if (this.is_valid() && this._value.lessThanOrEqualTo(Amount.bi_xns_max)){
      return this._value.times(Amount.bi_xns_unit).toString();
    } else {
      return NaN;   // TODO: why does to_text return NaN? return 'NaN'?
    }
  }

  // not native
  var offset = this._value.e - 15;
  var sign = this._value.isNegative() ? '-' : '';
  var mantissa = utils.getMantissaDecimalString(this._value.absoluteValue());
  if (offset !== 0 && (offset < -25 || offset > -4)) {
    // Use e notation.
    // XXX Clamp output.
    return sign + mantissa.toString() + 'e' + offset.toString();
  } else {
    var val    = '000000000000000000000000000' + mantissa.toString()
               + '00000000000000000000000';
    var pre    = val.substring(0, offset + 43);
    var post   = val.substring(offset + 43);
    var s_pre  = pre.match(/[1-9].*$/);  // Everything but leading zeros.
    var s_post = post.match(/[1-9]0*$/); // Last non-zero plus trailing zeros.

    return sign + (s_pre ? s_pre[0] : '0')
      + (s_post ? '.' + post.substring(0, 1 + post.length - s_post[0].length) : '');
  }

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

  var isNegative    = ref._value.isNegative();
  var valueString   = ref._value.abs().toString();
  var parts         = valueString.split('.');
  var int_part      = parts[0];
  var fraction_part = parts.length === 2 ? parts[1] : '';

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
  if (opts.signed && isNegative) {
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
  return this._is_native
      ? this.to_human() + '/XRP'
      : this.to_text() + '/' + this._currency.to_json() + '/' + this._issuer.to_json(opts);
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

    if (!this._value.isZero() && this._value.negated().equals(d._value)) {
      result = type + ' sign differs.';
    } else if (!this._value.equals(d._value)) {
      result = type + ' value differs.';
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
