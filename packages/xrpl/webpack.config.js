'use strict'
const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

function getDefaultConfiguration() {
  return {
    cache: true,
    performance: { hints: false },
    stats: 'errors-only',
    entry: './dist/npm/index.js',
    output: {
      library: 'xrpl',
      path: path.join(__dirname, 'build/'),
      filename: `xrpl.default.js`,
    },
    devtool: 'source-map',
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^ws$/, './WSWrapper'),
      new webpack.ProvidePlugin({ process: 'process/browser' }),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['source-map-loader'],
        },
      ],
    },
    resolve: {
      alias: {
        ws: './dist/npm/client/WSWrapper.js',
      },
      extensions: ['.js', '.json'],
      // We don't want to webpack any of the local dependencies:
      // ripple-address-codec, ripple-binary-codec, ripple-keypairs, which are
      // symlinked together via lerna
      symlinks: false,
      fallback: {
        buffer: require.resolve('buffer/'),
      },
    },
  }
}

module.exports = [
  (env, argv) => {
    const config = getDefaultConfiguration()
    config.mode = 'development'
    config.output.filename = `xrpl-latest.js`
    return config
  },
  (env, argv) => {
    const config = getDefaultConfiguration()
    config.mode = 'production'
    config.output.filename = `xrpl-latest-min.js`
    if (process.argv.includes('--analyze')) {
      config.plugins.push(new BundleAnalyzerPlugin())
    }
    return config
  },
]
