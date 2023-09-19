const { merge } = require('webpack-merge')
const { webpackForTest } = require('../../../weback.test.config')

module.exports = merge(
  require('../webpack.base.config'),
  webpackForTest('./test/integration/index.ts', __dirname),
  {
    externals: [
      {
        net: 'null', // net is used in tests to setup mock server
      },
    ],
  },
)
