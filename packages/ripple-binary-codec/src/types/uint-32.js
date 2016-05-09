const makeClass = require('../utils/make-class');
const {UInt} = require('./uint');

const UInt32 = makeClass({
  inherits: UInt,
  statics: {width: 4}
});

module.exports = {
  UInt32
};
