---
sidebar_position: 3
---

# Using xrpl.js with React Native

If you want to use `xrpl.js` with React Native you will need to install shims for core NodeJS modules. To help with this you can use a module like [rn-nodeify](https://github.com/tradle/rn-nodeify).

1. Install dependencies (you can use `yarn` as well):

   ```shell
   npm install react-native-crypto
   npm install xrpl
   # install peer deps
   npm install react-native-randombytes
   # install latest rn-nodeify
   npm install rn-nodeify@latest --dev
   ```

2. After that, run the following command:

   ```shell
   # install node core shims and recursively hack package.json files
   # in ./node_modules to add/update the "browser"/"react-native" field with relevant mappings
   ./node_modules/.bin/rn-nodeify --hack --install
   ```

3. Enable `crypto`:

   `rn-nodeify` will create a `shim.js` file in the project root directory.
   Open it and uncomment the line that requires the crypto module:

   ```javascript
   // If using the crypto shim, uncomment the following line to ensure
   // crypto is loaded first, so it can populate global.crypto
   require("crypto");
   ```

4. Import `shim` in your project (it must be the first line):

```javascript
import './shim'
...
```
