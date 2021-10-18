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
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^ws$/, './wsWrapper'),
      new webpack.NormalModuleReplacementPlugin(
        /^\.\/wallet\/index$/,
        './wallet-web',
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^.*setup-api$/,
        './setup-api-web',
      ),
      new webpack.ProvidePlugin({ process: 'process/browser' }),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/wordlists\/(?!english)/,
        contextRegExp: /bip39\/src$/,
      }),
    ],
    module: {
      rules: [],
    },
    resolve: {
      alias: {
        ws: './dist/npm/client/wsWrapper.js',
        'https-proxy-agent': false,
      },
      extensions: ['.js', '.json'],
      fallback: {
        buffer: require.resolve('buffer/'),
        assert: require.resolve('assert/'),
        url: require.resolve('url/'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        https: require.resolve('https-browserify'),
        http: require.resolve('stream-http'),
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
