const baseKarmaConfig = require('../../karma.config')
const webpackConfig = require('./test/webpack.config')
delete webpackConfig.entry

module.exports = function (config) {
  baseKarmaConfig(config)

  config.set({
    base: '',
    webpack: webpackConfig,

    // list of files / patterns to load in the browser
    files: ['test/**/*.test.ts'],
  })
}
