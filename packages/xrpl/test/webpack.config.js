'use strict'
const path = require('path')
const webpack = require('webpack')
const assert = require('assert')

const bnJsReplaces = [
  'tiny-secp256k1',
  'asn1.js',
  'create-ecdh',
  'miller-rabin',
  'public-encrypt',
  'elliptic',
]

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
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
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
        constants: require.resolve('constants-browserify'),
        fs: require.resolve('browserify-fs'),
        buffer: require.resolve('buffer/'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        path: require.resolve('path-browserify'),
      },
    },
  }
  return test
}

module.exports = [(env, argv) => webpackForTest('./test/integration/index.ts')]
