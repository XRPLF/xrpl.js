const webpackConfig = require("./test/webpack.config");
delete webpackConfig.entry;

module.exports = function (config) {
  config.set({
    plugins: ["karma-webpack", "karma-jasmine", "karma-chrome-launcher"],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    webpack: webpackConfig,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["jasmine"],

    // list of files / patterns to load in the browser
    files: ["build/xrplf-secret-numbers-latest.js", "test/*.test.ts"],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // Use webpack to bundle our test files
      "test/*.test.ts": ["webpack"],
    },

    browsers: ["ChromeHeadless"],
    // runs only one browser at a time
    concurrency: 1,
    // CI mode
    singleRun: true,
    client: {
      jasmine: {
        // ensures that tests are run in order instead of a random order
        random: false,
      },
    },
  });
};
