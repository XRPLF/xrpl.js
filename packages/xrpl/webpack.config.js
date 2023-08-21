'use strict'
const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { getDefaultConfiguration, wrapForEnv } = require('../../webpack.config')
const { merge } = require('webpack-merge')

const bnJsReplaces = [
  'tiny-secp256k1',
  'asn1.js',
  'create-ecdh',
  'miller-rabin',
  'public-encrypt',
  'elliptic',
]

module.exports = wrapForEnv(
  'xrpl',
  merge(getDefaultConfiguration(), {
    entry: './dist/npm/index.js',
    // overriding the output path and filename
    output: {
      library: 'xrpl',
      path: path.join(__dirname, 'build/'),
      filename: `xrpl.default.js`,
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^ws$/, './WSWrapper'),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/wordlists\/(?!english)/,
        contextRegExp: /bip39\/src$/,
      }),
      // this is a bit of a hack to prevent 'bn.js' from being installed 6 times
      // TODO: any package that is updated to use bn.js 5.x needs to be removed from `bnJsReplaces` above
      // https://github.com/webpack/webpack/issues/5593#issuecomment-390356276
      new webpack.NormalModuleReplacementPlugin(/^bn.js$/, (resource) => {
        if (
          bnJsReplaces.some((pkg) =>
            resource.context.includes(`node_modules/${pkg}`),
          )
        ) {
          resource.request = 'diffie-hellman/node_modules/bn.js'
        }
      }),
    ],
    resolve: {
      alias: {
        ws: './dist/npm/client/WSWrapper.js',
      },
    },
  }),
)
