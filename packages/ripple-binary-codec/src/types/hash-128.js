'use strict';

const makeClass = require('../utils/make-class');
const {Hash} = require('./hash');

const Hash128 = makeClass({
  inherits: Hash,
  statics: {width: 16}
});

module.exports = {
  Hash128
};
