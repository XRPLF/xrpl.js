const webpackConfig = require("./test/webpack.config");
const baseKarmaConfig = require("../../karma.config");
delete webpackConfig.entry;

module.exports = function (config) {
  config.set({
    webpack: webpackConfig,

    // list of files / patterns to load in the browser
    files: ["build/xrplf-secret-numbers-latest.js", "test/*.test.ts"],
  });

  baseKarmaConfig(config);
};
