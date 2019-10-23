/* eslint-disable no-var, no-param-reassign */
/* these eslint rules are disabled because gulp does not support babel yet */
'use strict';
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const gulp = require('gulp');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const pkg = require('./package.json');

const uglifyOptions = {
  mangle: {
    reserved: ['_', 'RippleError', 'RippledError', 'UnexpectedError',
    'LedgerVersionError', 'ConnectionError', 'NotConnectedError',
    'DisconnectedError', 'TimeoutError', 'ResponseFormatError',
    'ValidationError', 'NotFoundError', 'MissingLedgerHistoryError',
    'PendingLedgerVersionError'
    ]
  }
};

function getWebpackConfig(extension, overrides) {
  overrides = overrides || {};
  let defaults = {
    cache: true,
    externals: [{
      'lodash': '_'
    }],
    entry: './src/index.ts',
    output: {
      library: 'ripple',
      path: path.join(__dirname, 'build/'),
      filename: `ripple-${pkg.version}${extension}`
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^ws$/, './wswrapper'),
      new webpack.NormalModuleReplacementPlugin(/^\.\/wallet$/, './wallet-web'),
      new webpack.NormalModuleReplacementPlugin(/^.*setup-api$/,
        './setup-api-web')
    ],
    module: {
      rules: [{
        test: /jayson/,
        use: 'null',
      }, {
        test: /\.ts$/,
        use: [{
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              composite: false,
              declaration: false,
              declarationMap: false
            }
          },
        }],
      }]
    },
    resolve: {
      extensions: [ '.ts', '.js' ]
    },
  };
  return _.assign({}, defaults, overrides);
}

function webpackConfigForWebTest(testFileName) {
  var match = testFileName.match(/\/?([^\/]*)-test.js$/);
  if (!match) {
    assert(false, 'wrong filename:' + testFileName);
  }
  var configOverrides = {
    externals: [{
      'lodash': '_',
      'ripple-api': 'ripple',
      'net': 'null'
    }],
    entry: testFileName,
    output: {
      library: match[1].replace(/-/g, '_'),
      path: path.join(__dirname, 'test-compiled-for-web/'),
      filename: match[1] + '-test.js'
    }
  };
  return getWebpackConfig('.js', configOverrides);
}

function createLink(from, to) {
  if (fs.existsSync(to)) {
    fs.unlinkSync(to);
  }
  fs.linkSync(from, to);
}

function createBuildLink(callback) {
  return function(err, res) {
    createLink('./build/ripple-' + pkg.version + '.js',
      './build/ripple-latest.js');
    callback(err, res);
  };
}

function watch(callback) {
  gulp.watch('src/*', gulp.series(buildDebug));
  callback();
}

function build(callback) {
  webpack(getWebpackConfig('.js'), createBuildLink(callback));
}

function buildDebug(callback) {
  const webpackConfig = getWebpackConfig('-debug.js', {devtool: 'eval'});
  webpackConfig.plugins.unshift(new webpack.LoaderOptionsPlugin({debug: true}));
  webpack(webpackConfig, callback);
}

function buildMin(callback) {
  const webpackConfig = getWebpackConfig('-min.js');
  webpackConfig.plugins.push(new UglifyJsPlugin({uglifyOptions}));
  webpack(webpackConfig, function() {
    createLink('./build/ripple-' + pkg.version + '-min.js',
      './build/ripple-latest-min.js');
    callback();
  });
}

function buildTests(callback) {
  var times = 0;
  function done() {
    if (++times >= 5) {
      callback();
    }
  }
  webpack(webpackConfigForWebTest('./test/rangeset-test.js'), done);
  webpack(webpackConfigForWebTest('./test/connection-test.js'), done);
  webpack(webpackConfigForWebTest('./test/api-test.js'), done);
  webpack(webpackConfigForWebTest('./test/broadcast-api-test.js'), done);
  webpack(webpackConfigForWebTest('./test/integration/integration-test.js',
    'integration/'), done);
}

exports.watch = watch;
exports.build = build;
exports.buildDebug = buildDebug;
exports.buildMin = buildMin;
exports.buildTests = buildTests;

exports.default = gulp.parallel(build, buildDebug, buildMin);
