var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var webpack = require('webpack');
var jshint = require('gulp-jshint');
var map = require('map-stream');
var bump = require('gulp-bump');
var argv = require('yargs').argv;
//var header = require('gulp-header');

var pkg = require('./package.json');

var banner = '/*! <%= pkg.name %> - v<%= pkg.version %> - '
+ '<%= new Date().toISOString() %>\n'
+ '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>'
+ '* Copyright (c) <%= new Date().getFullYear() %> <%= pkg.author.name %>;'
+ ' Licensed <%= pkg.license %> */'

var sjclSrc = [
  'src/js/sjcl/core/sjcl.js',
  'src/js/sjcl/core/aes.js',
  'src/js/sjcl/core/bitArray.js',
  'src/js/sjcl/core/codecString.js',
  'src/js/sjcl/core/codecHex.js',
  'src/js/sjcl/core/codecBase64.js',
  'src/js/sjcl/core/codecBytes.js',
  'src/js/sjcl/core/sha256.js',
  'src/js/sjcl/core/sha512.js',
  'src/js/sjcl/core/sha1.js',
  'src/js/sjcl/core/ccm.js',
  // 'src/js/sjcl/core/cbc.js',
  // 'src/js/sjcl/core/ocb2.js',
  'src/js/sjcl/core/hmac.js',
  'src/js/sjcl/core/pbkdf2.js',
  'src/js/sjcl/core/random.js',
  'src/js/sjcl/core/convenience.js',
  'src/js/sjcl/core/bn.js',
  'src/js/sjcl/core/ecc.js',
  'src/js/sjcl/core/srp.js',
  'src/js/sjcl-custom/sjcl-ecc-pointextras.js',
  'src/js/sjcl-custom/sjcl-secp256k1.js',
  'src/js/sjcl-custom/sjcl-ripemd160.js',
  'src/js/sjcl-custom/sjcl-extramath.js',
  'src/js/sjcl-custom/sjcl-montgomery.js',
  'src/js/sjcl-custom/sjcl-validecc.js',
  'src/js/sjcl-custom/sjcl-ecdsa-canonical.js',
  'src/js/sjcl-custom/sjcl-ecdsa-der.js',
  'src/js/sjcl-custom/sjcl-ecdsa-recoverablepublickey.js',
  'src/js/sjcl-custom/sjcl-jacobi.js'
];

gulp.task('concat-sjcl', function() {
  return gulp.src(sjclSrc)
  .pipe(concat('sjcl.js'))
  .pipe(gulp.dest('./build/'));
});

gulp.task('build', [ 'concat-sjcl' ], function(callback) {
  webpack({
    cache: true,
    entry: './src/js/ripple/index.js',
    output: {
      library: 'ripple',
      path: './build/',
      filename: [ 'ripple-', '.js' ].join(pkg.version)
    },
  }, callback);
});

gulp.task('build-min', [ 'build' ], function(callback) {
  return gulp.src([ './build/ripple-', '.js' ].join(pkg.version))
  .pipe(uglify())
  .pipe(rename([ 'ripple-', '-min.js' ].join(pkg.version)))
  .pipe(gulp.dest('./build/'));
});

gulp.task('build-debug', [ 'concat-sjcl' ], function(callback) {
  webpack({
    cache: true,
    entry: './src/js/ripple/index.js',
    output: {
      library: 'ripple',
      path: './build/',
      filename: [ 'ripple-', '-debug.js' ].join(pkg.version)
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
  return 'var {<CONS>:function(){throw new Error("Class is unavailable in this build: <CONS>")}}'
  .replace(new RegExp('<CONS>', 'g'), cons);
};

gulp.task('build-core', [ 'concat-sjcl' ], function(callback) {
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
      filename: [ 'ripple-', '-core.js' ].join(pkg.version)
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin()
    ]
  }, callback);
});

gulp.task('bower-build', [ 'build' ], function(callback) {
  return gulp.src([ './build/ripple-', '.js' ].join(pkg.version))
  .pipe(rename('ripple.js'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower-build-min', [ 'build-min' ], function(callback) {
  return gulp.src([ './build/ripple-', '-min.js' ].join(pkg.version))
  .pipe(rename('ripple-min.js'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower-build-debug', [ 'build-debug' ], function(callback) {
  return gulp.src([ './build/ripple-', '-debug.js' ].join(pkg.version))
  .pipe(rename('ripple-debug.js'))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower-version', function() {
  gulp.src('./dist/bower.json')
  .pipe(bump({ version: pkg.version }))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('bower', ['bower-build', 'bower-build-min', 'bower-build-debug', 'bower-version']);

gulp.task('lint', function() {
  gulp.src('src/js/ripple/*.js')
  .pipe(jshint())
  .pipe(map(function(file, callback) {
    if (!file.jshint.success) {
      console.log('\nIn', file.path);

      file.jshint.results.forEach(function(err) {
        if (err && err.error) {
          var col1 = err.error.line + ':' + err.error.character;
          var col2 = '[' + err.error.reason + ']';
          var col3 = '(' + err.error.code + ')';

          while (col1.length < 8) {
            col1 += ' ';
          }

          console.log('  ' + [ col1, col2, col3 ].join(' '));
        }
      });
    }

    callback(null, file);
  }));
});

gulp.task('watch', function() {
  gulp.watch('src/js/ripple/*', [ 'build-debug' ]);
});

gulp.task('version-bump', function() {
  if (!argv.type) {
    throw new Error("No type found, pass it in using the --type argument");
  }

  gulp.src('./package.json')
  .pipe(bump({ type: argv.type }))
  .pipe(gulp.dest('./'));
});

gulp.task('version-beta', function() {
  gulp.src('./package.json')
  .pipe(bump({ version: pkg.version + '-beta' }))
  .pipe(gulp.dest('./'));
});

gulp.task('default', [ 'concat-sjcl', 'build', 'build-debug', 'build-min' ]);
