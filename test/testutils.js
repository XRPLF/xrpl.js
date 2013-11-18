var ripple = require('../src/js/ripple');

exports.get_config = get_config;

function get_config() {
  var config = { };
  try {
    config = require('./config');
  } catch(exception) {
    config = require('./config-example');
  }
  return load_config(config);
};

exports.load_config = load_config;

function load_config(config) {
  return load_module('config').load(config);
};

exports.load_module = load_module;

function load_module(name) {
  if (process.env.RIPPLE_LIB_COV) {
    return require('../src-cov/js/ripple/' + name)
  } else if (!ripple.hasOwnProperty(name)) {
    return require('../src/js/ripple/' + name);
  } else {
    return require('../src/js/ripple')[name];
  }
};
