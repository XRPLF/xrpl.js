/* eslint-disable no-var, no-param-reassign */
/* these eslint rules are disabled because gulp does not support babel yet */
'use strict';
var _ = require('lodash');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var webpack = require('webpack');
var bump = require('gulp-bump');
var argv = require('yargs').argv;
var assert = require('assert');
var fs = require('fs');

var pkg = require('./package.json');

var uglifyOptions = {
  mangle: {
    except: ['_', 'RippleError', 'RippledError', 'UnexpectedError',
    'LedgerVersionError', 'ConnectionError', 'NotConnectedError',
    'DisconnectedError', 'TimeoutError', 'ResponseFormatError',
    'ValidationError', 'NotFoundError', 'MissingLedgerHistoryError',
    'PendingLedgerVersionError'
    ]
  }
};

function webpackConfig(extension, overrides) {
  overrides = overrides || {};
  var defaults = {
    cache: true,
    externals: [{
      'lodash': '_'
    }],
    entry: './src/index.js',
    output: {
      library: 'ripple',
      path: './build/',
      filename: ['ripple-', extension].join(pkg.version)
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^ws$/, './wswrapper'),
      new webpack.NormalModuleReplacementPlugin(/^\.\/wallet$/, './wallet-web'),
      new webpack.NormalModuleReplacementPlugin(/^.*setup-api$/,
        './setup-api-web')
    ],
    module: {
      loaders: [{
        test: /jayson/,
        loader: 'null'
      }, {
        test: /\.js$/,
        exclude: [/node_modules/],
        loader: 'babel-loader'
      }, {
        test: /\.json/,
        loader: 'json-loader'
      }]
    }
  };
  return _.assign({}, defaults, overrides);
}

function webpackConfigForWebTest(testFileName, path) {
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
      path: './test-compiled-for-web/' + (path ? path : ''),
      filename: match[1] + '-test.js'
    }
  };
  return webpackConfig('.js', configOverrides);
}

gulp.task('build-tests', function(callback) {
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
});

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

gulp.task('build', function(callback) {
  webpack(webpackConfig('.js'), createBuildLink(callback));
});

gulp.task('build-min', ['build'], function() {
  return gulp.src(['./build/ripple-', '.js'].join(pkg.version))
  .pipe(uglify(uglifyOptions))
  .pipe(rename(['ripple-', '-min.js'].join(pkg.version)))
  .pipe(gulp.dest('./build/'))
  .on('end', function() {
    createLink('./build/ripple-' + pkg.version + '-min.js',
      './build/ripple-latest-min.js');
  });
});

gulp.task('build-debug', function(callback) {
  var configOverrides = {debug: true, devtool: 'eval'};
  webpack(webpackConfig('-debug.js', configOverrides), callback);
});

/**
 * Generate a WebPack external for a given unavailable module which replaces
 * that module's constructor with an error-thrower
 */

function buildUseError(cons) {
  return ('var {<CONS>:function(){throw new Error('
          + '"Class is unavailable in this build: <CONS>")}}')
          .replace(new RegExp('<CONS>', 'g'), cons);
}

gulp.task('build-core', function(callback) {
  var configOverrides = {
    cache: false,
    entry: './src/remote.js',
    externals: [{
      './transaction': buildUseError('Transaction'),
      './orderbook': buildUseError('OrderBook'),
      './account': buildUseError('Account'),
      './serializedobject': buildUseError('SerializedObject')
    }],
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ]
  };
  webpack(webpackConfig('-core.js', configOverrides), callback);
});

gulp.task('bower-build', ['build'], function() {
  return gulp.src(['./build/ripple-', '.js'].join(pkg.version))
  .pipe(rename('ripple.js'))
  .pipe(gulp.dest('./dist/bower'));
});

gulp.task('bower-build-min', ['build-min'], function() {
  return gulp.src(['./build/ripple-', '-min.js'].join(pkg.version))
  .pipe(rename('ripple-min.js'))
  .pipe(gulp.dest('./dist/bower'));
});

gulp.task('bower-build-debug', ['build-debug'], function() {
  return gulp.src(['./build/ripple-', '-debug.js'].join(pkg.version))
  .pipe(rename('ripple-debug.js'))
  .pipe(gulp.dest('./dist/bower'));
});

gulp.task('bower-version', function() {
  gulp.src('./dist/bower/bower.json')
  .pipe(bump({version: pkg.version}))
  .pipe(gulp.dest('./dist/bower'));
});

gulp.task('bower', ['bower-build', 'bower-build-min', 'bower-build-debug',
                    'bower-version']);

gulp.task('watch', function() {
  gulp.watch('src/*', ['build-debug']);
});

gulp.task('version-bump', function() {
  if (!argv.type) {
    throw new Error('No type found, pass it in using the --type argument');
  }

  gulp.src('./package.json')
  .pipe(bump({type: argv.type}))
  .pipe(gulp.dest('./'));
});

gulp.task('version-beta', function() {
  gulp.src('./package.json')
  .pipe(bump({version: pkg.version + '-beta'}))
  .pipe(gulp.dest('./'));
});

gulp.task('default', ['build', 'build-debug', 'build-min']);
