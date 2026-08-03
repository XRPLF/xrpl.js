const webpack = require('webpack')
const { merge } = require('webpack-merge')
const { webpackForTest } = require('../../../webpack.test.config')

module.exports = merge(
  require('../webpack.base.config'),
  webpackForTest('./test/integration/index.ts', __dirname),
  {
    externals: [
      {
        net: 'null', // net is used in tests to setup mock server
      },
    ],
    // The @xrplf/mpt-crypto ESM glue's Node branch (dead in the browser, guarded
    // by ENVIRONMENT_IS_NODE) still pulls in node: builtins at build time; rewrite
    // the scheme (below) and stub the modules so the browser bundle compiles.
    resolve: {
      fallback: {
        fs: false,
        crypto: false,
        path: false,
        url: false,
        module: false,
      },
    },
    module: {
      rules: [
        // The .mjs glue is strict ESM, so webpack enforces fully-specified imports
        // on it — but it (and the injected process/browser) use extensionless
        // specifiers we can't edit. Relax the rule so they resolve.
        {
          test: /\.m?js$/u,
          resolve: { fullySpecified: false },
        },
      ],
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^node:/u, (resource) => {
        resource.request = resource.request.replace(/^node:/u, '')
      }),
    ],
  },
)
