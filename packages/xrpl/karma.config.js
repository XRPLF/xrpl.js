const webpackConfig = require('./test/webpack.config')[0]()
delete webpackConfig.entry

module.exports = function (config) {
  config.set({
    plugins: ['karma-webpack', 'karma-jasmine', 'karma-chrome-launcher'],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    webpack: webpackConfig,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'build/xrpl-latest.js',
      'test/integration/index.ts',
      'karma-setup.js',
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'karma-setup.js': ['webpack'],
      // Use webpack to bundle our test files
      'test/integration/index.ts': ['webpack'],
    },

    browsers: ['ChromeHeadless'],
  })
}
