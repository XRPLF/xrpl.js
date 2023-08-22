"use strict";
const { merge } = require("webpack-merge");
const { getDefaultConfiguration, wrapForEnv } = require("../../webpack.config");
const path = require("path");

module.exports = merge(getDefaultConfiguration(), {
  entry: "./dist/index.js",
  // overriding the output path and filename
  output: {
    library: "xrpl_secret_numbers",
    filename: `xrpl-secret-numbers.default.js`,
    path: path.join(__dirname, "build/"),
  },
});
