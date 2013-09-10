
exports.get_config = get_config;

function get_config() {
  var config = { };
  try {
    config = require('./config');
  } catch(exception) {
    config = require('./config-example');
  }
  return load_config(config);
}

exports.load_config = load_config;

function load_config(config) {
  return( require('../src/js/ripple/config')).load(config);
}

exports.load_module = load_module;

function load_module(name) {
  return require((process.env.RIPPLE_LIB_COV ? '../lib-cov/' : '../src/js/ripple/') + name);
}
