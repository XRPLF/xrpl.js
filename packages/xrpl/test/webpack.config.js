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
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    externals: [
      {
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
      new webpack.NormalModuleReplacementPlugin(/^ws$/, './WSWrapper'),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      new webpack.DefinePlugin({
        'process.stdout': {},
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
      },
    },
  }
  return test
}

module.exports = [(env, argv) => webpackForTest('./test/integration/index.ts')]
