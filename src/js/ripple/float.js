/**
 * IEEE 754 floating-point.
 *
 * Supports single- or double-precision
 */
var Float = exports.Float = {};

var allZeros = /^0+$/;
var allOnes = /^1+$/;

Float.fromBytes = function(bytes) {
  // Render in binary.  Hackish.
  var b = '';

  for (var i = 0, n = bytes.length; i < n; i++) {
    var bits = (bytes[i] & 0xff).toString(2);

    while (bits.length < 8) {
      bits = '0' + bits;
    }

    b += bits;
  }

  // Determine configuration.  This could have all been precomputed but it is fast enough.
  var exponentBits = bytes.length === 4 ? 4 : 11;
  var mantissaBits = (bytes.length * 8) - exponentBits - 1;
  var bias = Math.pow(2, exponentBits - 1) - 1;
  var minExponent = 1 - bias - mantissaBits;

  // Break up the binary representation into its pieces for easier processing.
  var s = b[0];
  var e = b.substring(1, exponentBits + 1);
  var m = b.substring(exponentBits + 1);

  var value = 0;
  var multiplier = (s === '0' ? 1 : -1);

  if (allZeros.test(e)) {
    // Zero or denormalized
    if (!allZeros.test(m)) {
      value = parseInt(m, 2) * Math.pow(2, minExponent);
    }
  } else if (allOnes.test(e)) {
    // Infinity or NaN
    if (allZeros.test(m)) {
      value = Infinity;
    } else {
      value = NaN;
    }
  } else {
    // Normalized
    var exponent = parseInt(e, 2) - bias;
    var mantissa = parseInt(m, 2);
    value = (1 + (mantissa * Math.pow(2, -mantissaBits))) * Math.pow(2, exponent);
  }

  return value * multiplier;
};
