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
    // Here I'm including all of the the Jest tests which are all under the __tests__ directory.
    // You may need to tweak this patter to find your test files/
    files: [
      // {
      //   pattern: 'test/integration/transactions/*.test.ts',
      //   type: 'js',
      // },
      // {
      //   pattern: 'test/integration/requests/*.test.ts',
      //   type: 'js',
      // },
      // {
      //   pattern: 'test/integration/fundWallet.test.ts',
      //   type: 'js',
      // },
      // {
      //   pattern: 'test/integration/integration.test.ts',
      //   type: 'js',
      // },
      // {
      //   pattern: 'test/integration/regularKey.test.ts',
      //   type: 'js',
      // },
      // {
      //   pattern: 'test/integration/finalTest.test.ts',
      //   type: 'js',
      // },
      // {
      //   pattern: 'test/integration/index.ts',
      //   type: 'js',
      // },
      // {
      //   pattern: 'karma-setup.js',
      //   type: 'js',
      // },
      'build/xrpl-latest.js',
      'test/integration/index.ts',
      'karma-setup.js',
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'karma-setup.js': ['webpack'],
      // Use webpack to bundle our tests files
      'test/integration/index.ts': ['webpack'],
    },

    browsers: ['ChromeHeadless'],
  })
}
