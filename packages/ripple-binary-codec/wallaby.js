'use strict';

var babel = require('babel');
module.exports = function(wallaby) {
  return {
    files: [
      'src/**/*.js',
      'src/enums/*.json',
      'test/utils.js',
      'examples/*.js',
      'test/fixtures/**/*.*'
    ],
    tests: [
      'test/*-test.js',
      '!test/examples-test.js'
    ],
    env: {
      type: 'node'
    },
    testFramework: 'mocha@2.1.0',
    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babel: babel
      })
    },
    debug: true
  };
};
