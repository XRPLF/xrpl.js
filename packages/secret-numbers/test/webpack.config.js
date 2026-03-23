"use strict";
const { merge } = require("webpack-merge");
const { webpackForTest } = require("../../../webpack.test.config");
const baseConfig = require("../webpack.base.config");

module.exports = merge(
  baseConfig,
  webpackForTest("./test/index.ts", __dirname)
);
