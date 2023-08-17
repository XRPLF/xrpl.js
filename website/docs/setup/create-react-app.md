---
sidebar_position: 2
---

# Using xrpl.js with `create-react-app`

To use `xrpl.js` with React, you need to install shims for core NodeJS modules. Starting with version 5, Webpack stopped including shims by default, so you must modify your Webpack configuration to add the shims you need. Either you can eject your config and modify it, or you can use a library such as `react-app-rewired`. The example below uses `react-app-rewired`.

1. Install shims (you can use `yarn` as well):

   ```shell
   npm install --save-dev \
       assert \
       buffer \
       crypto-browserify \
       https-browserify \
       os-browserify \
       process \
       stream-browserify \
       stream-http \
       url
   ```

2. Modify your webpack configuration

   1. Install `react-app-rewired`

      ```shell
      npm install --save-dev react-app-rewired
      ```

   2. At the project root, add a file named `config-overrides.js` with the following content:

      ```javascript
      const webpack = require("webpack");

      module.exports = function override(config) {
        const fallback = config.resolve.fallback || {};
        Object.assign(fallback, {
          assert: require.resolve("assert"),
          crypto: require.resolve("crypto-browserify"),
          http: require.resolve("stream-http"),
          https: require.resolve("https-browserify"),
          os: require.resolve("os-browserify"),
          stream: require.resolve("stream-browserify"),
          url: require.resolve("url"),
          ws: require.resolve("xrpl/dist/npm/client/WSWrapper"),
        });
        config.resolve.fallback = fallback;
        config.plugins = (config.plugins || []).concat([
          new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
          }),
        ]);

        // This is deprecated in webpack 5 but alias false does not seem to work
        config.module.rules.push({
          test: /node_modules[\\\/]https-proxy-agent[\\\/]/,
          use: "null-loader",
        });
        return config;
      };
      ```

   3. Update package.json scripts section with

      ```
      "start": "react-app-rewired start",
      "build": "react-app-rewired build",
      "test": "react-app-rewired test",
      ```

This online template uses these steps to run xrpl.js with React in the browser:
https://codesandbox.io/s/xrpl-intro-pxgdjr?file=/src/App.js
