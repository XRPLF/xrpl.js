const path = require("path");
const { getDefaultConfiguration, wrapForEnv } = require("../../webpack.config");
const { merge } = require("webpack-merge");

module.exports = wrapForEnv(
  "xrplf-secret-numbers",
  merge(getDefaultConfiguration(), require("./webpack.base.config"))
);
