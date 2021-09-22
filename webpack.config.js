'use strict'
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const assert = require('assert')
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

function webpackForTest(testFileName) {
  const match = testFileName.match(/\/?([^\/]*)\.ts$/)
  if (!match) {
    assert(false, 'wrong filename:' + testFileName)
  }

  const test = {
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
  // return Object.assign({}, getDefaultConfiguration(), test)
  return test
}

function webpackIntegrationTests() {
  const dir = './test/integration/'
  const tests = []
  const dirPaths = fs.readdirSync(dir)
  tests.push(webpackForTest(`./${path.join(dir, 'integration.ts')}`))
  const subdirs = dirPaths.filter(
    (filename) =>
      !filename.match(/\/?([^\/]*)\.ts$/) && filename !== 'README.md',
  )
  subdirs.forEach((subdir) => {
    const subdirPaths = fs.readdirSync(path.join(dir, subdir))
    subdirPaths.forEach((filename) => {
      tests.push(webpackForTest(`./${path.join(dir, subdir, filename)}`))
    })
  })
  return tests.map(
    (test) => (env, argv) => Object.assign({}, getDefaultConfiguration(), test),
  )
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
  ...webpackIntegrationTests(),
]
