'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var watch = require('gulp-watch');
var plumber = require('gulp-plumber');
var filelog = require('gulp-filelog');
var cleanDest = require('gulp-clean-dest');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var webpack = require('webpack');
var bump = require('gulp-bump');
var react = require('gulp-react');
var flow = require('gulp-flowtype');
var argv = require('yargs').argv;

var pkg = require('./package.json');

function logPluginError(error) {
  gutil.log(error.toString());
}

gulp.task('build', function(callback) {
  webpack({
    cache: true,
    entry: './src/js/ripple/index.js',
    output: {
      library: 'ripple',
      path: './build/',
      filename: ['ripple-', '.js'].join(pkg.version)
    }
  }, callback);
});

gulp.task('build-min', ['build'], function() {
  return gulp.src(['./build/ripple-', '.js'].join(pkg.version))
  .pipe(uglify())
  .pipe(rename(['ripple-', '-min.js'].join(pkg.version)))
  .pipe(gulp.dest('./build/'));
});

gulp.task('build-debug', function(callback) {
  webpack({
    cache: true,
    entry: './src/js/ripple/index.js',
    output: {
      library: 'ripple',
      path: './build/',
      filename: ['ripple-', '-debug.js'].join(pkg.version)
    },
    debug: true,
    devtool: 'eval'
  }, callback);
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
  webpack({
    entry: [
      './src/js/ripple/remote.js'
    ],
    externals: [
      {
        './transaction': buildUseError('Transaction'),
        './orderbook': buildUseError('OrderBook'),
        './account': buildUseError('Account'),
        './serializedobject': buildUseError('SerializedObject')
      }
    ],
    output: {
      library: 'ripple',
      path: './build/',
      filename: ['ripple-', '-core.js'].join(pkg.version)
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ]
  }, callback);
});

gulp.task('bower-build', ['build'], function() {
  return gulp.src(['./build/ripple-', '.js'].join(pkg.version))
  .pipe(rename('ripple.js'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower-build-min', ['build-min'], function() {
  return gulp.src(['./build/ripple-', '-min.js'].join(pkg.version))
  .pipe(rename('ripple-min.js'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower-build-debug', ['build-debug'], function() {
  return gulp.src(['./build/ripple-', '-debug.js'].join(pkg.version))
  .pipe(rename('ripple-debug.js'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower-version', function() {
  gulp.src('./dist/bower.json')
  .pipe(bump({version: pkg.version}))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower', ['bower-build', 'bower-build-min', 'bower-build-debug',
                    'bower-version']);

gulp.task('watch', function() {
  gulp.watch('src/js/ripple/*', ['build-debug']);
});

// To use this, each javascript file must have /* @flow */ on the first line
gulp.task('typecheck', function() {
  return gulp.src('src/js/ripple/*.js')
  .pipe(flow({      // note: do not set the 'all' option, it is broken
    weak: true,   // remove this after all errors are addressed
    killFlow: true
  }));
});

gulp.task('strip', function() {
  return gulp.src('src/js/ripple/*.js')
  .pipe(watch('src/js/ripple/*.js'))
  .pipe(cleanDest('out'))   // delete outdated output file before stripping
  .pipe(plumber())        // prevent an error in one file from ending build
  .pipe(react({stripTypes: true}).on('error', logPluginError))
  .pipe(filelog())
  .pipe(gulp.dest('out'));
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
