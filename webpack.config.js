"use strict";
const path = require("path");
const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { merge } = require("webpack-merge");

const bnJsReplaces = [
  "tiny-secp256k1",
  "asn1.js",
  "create-ecdh",
  "miller-rabin",
  "public-encrypt",
  "elliptic",
];

function getDefaultConfiguration() {
  return {
    cache: true,
    performance: { hints: false },
    stats: "errors-only",
    devtool: "source-map",
    plugins: [
      new webpack.ProvidePlugin({ process: "process/browser" }),
      new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
      // this is a bit of a hack to prevent 'bn.js' from being installed 6 times
      // TODO: any package that is updated to use bn.js 5.x needs to be removed from `bnJsReplaces` above
      // https://github.com/webpack/webpack/issues/5593#issuecomment-390356276
      new webpack.NormalModuleReplacementPlugin(/^bn.js$/, (resource) => {
        if (
          bnJsReplaces.some((pkg) =>
            resource.context.includes(`node_modules/${pkg}`)
          )
        ) {
          resource.request = "diffie-hellman/node_modules/bn.js";
        }
      }),
    ],
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
      fallback: {
        buffer: require.resolve("buffer"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
      },
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
            })
          );
        }
        return localConfig;
      },
    ];
  },
};
