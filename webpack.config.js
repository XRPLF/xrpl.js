"use strict";
const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { merge } = require("webpack-merge");

function getDefaultConfiguration() {
  return {
    cache: true,
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    stats: "errors-only",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ["source-map-loader"],
        },
      ],
    },
    resolve: {
      extensions: [".js", ".json"],
      // We don't want to webpack any of the local dependencies:
      // ripple-address-codec, ripple-binary-codec, ripple-keypairs, which are
      // symlinked together via lerna
      symlinks: false,
    },
  };
}

module.exports = {
  getDefaultConfiguration,
  wrapForEnv: (filename, config) => {
    return [
      (env, argv) => {
        const localConfig = merge(config, {
          mode: "development",
          output: {
            filename: `${filename}-latest.js`,
          },
        });
        return localConfig;
      },
      (env, argv) => {
        const localConfig = merge(config, {
          mode: "production",
          output: {
            filename: `${filename}-latest.min.js`,
          },
        });

        if (process.argv.includes("--analyze")) {
          localConfig.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerPort: `auto`,
              analyzerMode: "static",
            }),
          );
        }
        return localConfig;
      },
    ];
  },
};
