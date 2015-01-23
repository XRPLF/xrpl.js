var BigNumber = require('bignumber.js');
var extend = require('extend');

function BigNumberWrapper(value, base) {
  // reset config every time a BigNumber is instantiated so that
  // these global settings won't be overridden if another file tries
  // to set them at require-time.
  BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
                     DECIMAL_PLACES: 40 });
  BigNumber.call(this, value, base);
}

extend(BigNumberWrapper, BigNumber);    // copy class static properties
BigNumberWrapper.prototype = BigNumber.prototype;

BigNumberWrapper.config = function() {
  throw new Error('BigNumber.config may only be called from bignumber.js');
};

BigNumberWrapper.withRoundingMode = function(roundingMode, func) {
  var config = BigNumber.config();
  var oldRoundingMode = config.ROUNDING_MODE;
  config.ROUNDING_MODE = roundingMode;
  BigNumber.config(config);
  try {
    return func();
  } finally {
    config.ROUNDING_MODE = oldRoundingMode;
    BigNumber.config(config);
  }
};

module.exports = BigNumberWrapper;
