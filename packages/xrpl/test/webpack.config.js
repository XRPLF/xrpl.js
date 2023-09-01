'use strict'
const assert = require('assert')
const path = require('path')
const webpack = require('webpack')

function webpackForTest(testFileName) {
  const match = testFileName.match(/\/?([^\/]*)\.ts$/)
  if (!match) {
    assert(false, 'wrong filename:' + testFileName)
  }

  return merge(require('../webpack.base.config'), {
    mode: 'production',
    cache: true,
    externals: [
      {
        net: 'null', // net is used in tests to setup mock server
      },
    ],
    entry: testFileName,
    output: {
      library: match[1].replace(/-/g, '_'),
      path: path.join(__dirname, './testCompiledForWeb/'),
      filename: match[1] + '.js',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.stdout': {},
      }),
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    ],
    module: {
      rules: [
        // Compile the tests
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  lib: ['esnext', 'dom'],
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
        ws: './dist/npm/client/WSWrapper.js',
      },
      extensions: ['.ts', '.js', '.json'],
      fallback: {
        module: false,
        buffer: require.resolve('buffer/'),
      },
    },
  })
}

module.exports = [(env, argv) => webpackForTest('./test/integration/index.ts')]
