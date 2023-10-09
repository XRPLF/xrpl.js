'use strict'
const { merge } = require('webpack-merge')
const { webpackForTest } = require('../../../weback.test.config')
const { getDefaultConfiguration } = require('../../../webpack.config')

module.exports = merge(
  getDefaultConfiguration(),
  webpackForTest('./test/index.ts', __dirname),
)
