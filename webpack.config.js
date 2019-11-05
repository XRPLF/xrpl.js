'use strict';
const path = require('path');
const webpack = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

function getDefaultConfiguration() {
  return {
  cache: true,
  performance: { hints: false },
  stats: 'errors-only',
  externals: [{
    'lodash': '_'
  }],
  entry: './dist/npm/index.js',
  output: {
    library: 'ripple',
    path: path.join(__dirname, 'build/'),
    filename: `ripple-lib.default.js`,
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^ws$/, './wswrapper'),
    new webpack.NormalModuleReplacementPlugin(/^\.\/wallet$/, './wallet-web'),
    new webpack.NormalModuleReplacementPlugin(/^.*setup-api$/, './setup-api-web'),
  ],
  module: {
    rules: []
  },
  resolve: {
    extensions: ['.js', '.json']
  },
};
}

module.exports = [
  function(env, argv) {
    const config = getDefaultConfiguration();
    config.mode = 'development';
    config.output.filename = `ripple-lib.development.js`;
    return config;
  },
  function(env, argv) {
    const config = getDefaultConfiguration();
    config.mode = 'production';
    config.output.filename = `ripple-lib.production.min.js`;
    if (process.argv.includes('--analyze')) {
      config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
  },
];