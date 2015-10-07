'use strict';

const makeClass = require('../utils/make-class');
const {UInt} = require('./uint');

const UInt8 = makeClass({
  inherits: UInt,
  statics: {width: 1}
});

module.exports = {
  UInt8
};
