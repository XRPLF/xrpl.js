'use strict';

const makeClass = require('../utils/make-class');
const {Hash} = require('./hash');

const Hash160 = makeClass({
  inherits: Hash,
  statics: {width: 20}
});

module.exports = {
  Hash160
};
