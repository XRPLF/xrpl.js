"use strict";
const assert = require("assert");
const path = require("path");
const webpack = require("webpack");
const { merge } = require("webpack-merge");

function webpackForTest(testFileName) {
  const match = testFileName.match(/\/?([^\/]*)\.ts$/);
  if (!match) {
    assert(false, "wrong filename:" + testFileName);
  }

  const test = merge(require("../webpack.base.config"), {
    mode: "production",
    cache: true,
    entry: testFileName,
    output: {
      library: match[1].replace(/-/g, "_"),
      path: path.join(__dirname, "./testCompiledForWeb/"),
      filename: match[1] + ".js",
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.stdout": {},
      }),
    ],
    module: {
      rules: [
        // Compile the tests
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  lib: ["esnext", "dom"],
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
      extensions: [".ts", ".js", ".json"],
    },
  });

  return test;
}

module.exports = webpackForTest("./test/index.ts");
