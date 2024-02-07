const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')
const { getDefaultConfiguration } = require('../../webpack.config')

module.exports = merge(getDefaultConfiguration(), {
  entry: './dist/npm/index.js',
  // overriding the output path and filename
  output: {
    library: 'xrpl',
    path: path.join(__dirname, 'build/'),
    filename: `xrpl.default.js`,
  }
})
