/* eslint-disable new-cap */
'use strict';

const assert = require('assert-diff');
const _ = require('lodash');
const jayson = require('jayson');

const RippleAPI = require('./api').RippleAPI;


function createHTTPServer(options, httpPort) {
  const rippleAPI = new RippleAPI(options);

  const methodNames = _.filter(_.keys(RippleAPI.prototype), k => {
    return typeof RippleAPI.prototype[k] === 'function'
    && k !== 'connect'
    && k !== 'disconnect'
    && k !== 'constructor'
    && k !== 'RippleAPI';
  });

  function applyPromiseWithCallback(fnName, callback, args_) {
    try {
      let args = args_;
      if (!_.isArray(args_)) {
        const fnParameters = jayson.Utils.getParameterNames(rippleAPI[fnName]);
        args = fnParameters.map(name => args_[name]);
        const defaultArgs = _.omit(args_, fnParameters);
        assert(_.size(defaultArgs) <= 1,
          'Function must have no more than one default argument');
        if (_.size(defaultArgs) > 0) {
          args.push(defaultArgs[_.keys(defaultArgs)[0]]);
        }
      }
      Promise.resolve(rippleAPI[fnName].apply(rippleAPI, args))
        .then(res => callback(null, res))
        .catch(err => {
          callback({code: 99, message: err.message, data: {name: err.name}});
        });
    } catch (err) {
      callback({code: 99, message: err.message, data: {name: err.name}});
    }
  }

  const methods = {};
  _.forEach(methodNames, fn => {
    methods[fn] = jayson.Method((args, cb) => {
      applyPromiseWithCallback(fn, cb, args);
    }, {collect: true});
  });

  const server = jayson.server(methods);
  let httpServer = null;

  return {
    server: server,
    start: function() {
      if (httpServer !== null) {
        return Promise.reject('Already started');
      }
      return new Promise((resolve) => {
        rippleAPI.connect().then(() => {
          httpServer = server.http();
          httpServer.listen(httpPort, resolve);
        });
      });
    },
    stop: function() {
      if (httpServer === null) {
        return Promise.reject('Not started');
      }
      return new Promise((resolve) => {
        rippleAPI.disconnect();
        httpServer.close(() => {
          httpServer = null;
          resolve();
        });
      });
    }
  };
}

module.exports = {
  createHTTPServer
};
