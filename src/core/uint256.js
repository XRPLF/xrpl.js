'use strict';

const utils = require('./utils');
const extend = require('extend');
const UInt = require('./uint').UInt;

//
// UInt256 support
//

const UInt256 = extend(function() {
  this._value = NaN;
}, UInt);

UInt256.width = 32;
UInt256.prototype = Object.create(extend({}, UInt.prototype));
UInt256.prototype.constructor = UInt256;

const HEX_ZERO = UInt256.HEX_ZERO = '00000000000000000000000000000000' +
                                  '00000000000000000000000000000000';

const HEX_ONE = UInt256.HEX_ONE = '00000000000000000000000000000000' +
                                '00000000000000000000000000000001';

UInt256.STR_ZERO = utils.hexToString(HEX_ZERO);
UInt256.STR_ONE = utils.hexToString(HEX_ONE);

exports.UInt256 = UInt256;
