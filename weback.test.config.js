"use strict";
const assert = require("assert");
const path = require("path");
const webpack = require("webpack");

function webpackForTest(testFileName, basePath) {
  const match = testFileName.match(/\/?([^\/]*)\.ts$/);
  if (!match) {
    assert(false, "wrong filename:" + testFileName);
  }

  return {
    mode: "production",
    cache: true,
    entry: testFileName,
    output: {
      library: match[1].replace(/-/g, "_"),
      path: path.join(basePath, "./testCompiledForWeb/"),
      filename: match[1] + ".js",
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.stdout": {},
      }),
    ],
    module: {
      rules: [
        // Compile compile the tests
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
  };
}

module.exports = {
  webpackForTest,
};
