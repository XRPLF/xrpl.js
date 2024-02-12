const baseKarmaConfig = require('../../karma.config')
const webpackConfig = require('./test/webpack.config')
delete webpackConfig.entry

module.exports = function (config) {
  config.set({
    webpack: webpackConfig,

    // list of files / patterns to load in the browser
    files: ['build/xrpl-latest.js', 'test/integration/**/*.test.ts'],
  })

  baseKarmaConfig(config)
}
