const path = require("path");
const { getDefaultConfiguration, wrapForEnv } = require("../../webpack.config");
const { merge } = require("webpack-merge");

module.exports = wrapForEnv(
  "xrpl-secret-numbers",
  merge(getDefaultConfiguration(), {
    entry: "./dist/index.js",
    // overriding the output path and filename
    output: {
      library: "xrpl_secret_numbers",
      filename: `xrpl-secret-numbers.default.js`,
      path: path.join(__dirname, "build/"),
    },
  })
);
