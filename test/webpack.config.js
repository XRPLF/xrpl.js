'use strict'
const path = require('path')
const webpack = require('webpack')
const assert = require('assert')

function webpackForTest(testFileName) {
  const match = testFileName.match(/\/?([^\/]*)\.ts$/)
  if (!match) {
    assert(false, 'wrong filename:' + testFileName)
  }

  const test = {
    mode: 'production',
    cache: true,
    externals: [
      {
        'xrpl-local': 'xrpl',
        net: 'null',
      },
    ],
    entry: testFileName,
    output: {
      library: match[1].replace(/-/g, '_'),
      path: path.join(__dirname, './testCompiledForWeb/'),
      filename: match[1] + '.js',
    },
    plugins: [
      new webpack.ProvidePlugin({ process: 'process/browser' }),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/wordlists\/(?!english)/,
        contextRegExp: /bip39\/src$/,
      }),
    ],
    module: {
      rules: [
        {
          test: /jayson/,
          use: 'null',
        },
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  composite: false,
                  declaration: false,
                  declarationMap: false,
                },
              },
            },
          ],
        },
      ],
    },
    node: {
      global: true,
      __filename: false,
      __dirname: true,
    },
    resolve: {
      alias: {
        ws: './dist/npm/client/wsWrapper.js',
        'https-proxy-agent': false,
      },
      extensions: ['.ts', '.js', '.json'],
      fallback: {
        buffer: require.resolve('buffer/'),
        assert: require.resolve('assert/'),
        url: require.resolve('url/'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        path: require.resolve('path-browserify'),
        http: require.resolve('stream-http'),
      },
    },
  }
  return test
}

module.exports = [(env, argv) => webpackForTest('./test/integration/index.ts')]
