# Unique Setup Steps for Xrpl.js

Starting in 3.0 xrpl and all the packages in this repo no longer require custom configurations (ex. polyfills) to run.

### Using xrpl.js from a CDN

You can avoid setting up your build system to handle `xrpl.js` by using a cdn version that is prebuilt for the browser.

- unpkg `<script src="https://unpkg.com/xrpl@2.3.0/build/xrpl-latest-min.js"></script>`
- jsdelivr `<script src="https://cdn.jsdelivr.net/npm/xrpl@2.3.0/build/xrpl-latest-min.js"></script>`

Ensure that the full path is provided so the browser can find the sourcemaps.

### Using xrpl.js with `create-react-app`

Starting in 3.0 xrpl and its related packages no longer require custom configurations (ex. polyfills) to run.

This online template uses these steps to run xrpl.js with React in the browser:
https://codesandbox.io/s/xrpl-intro-pxgdjr?file=/src/App.js

### Using xrpl.js with React Native

If you want to use `xrpl.js` with React Native you will need to install polyfills for core NodeJS modules.

1. Install dependencies (you can use `yarn` as well):

   ```shell
   npm install xrpl \
       fast-text-encoding \
       react-native-get-random-values
   ```

2. After that, run the following commands:

   ```shell
   # compile `react-native-get-random-values` pods see https://www.npmjs.com/package/react-native-get-random-values#installation
   npx pod-install
   ```
   
3. Create `polyfills.js` and add

```javascript
// Required for TextEncoder/TextDecoder
import 'fast-text-encoding'
// Required for `crypto.getRandomValues`
import 'react-native-get-random-values'
```

4. Import `polyfills` in index file your project (it must be the first line):

```javascript
import './polyfills'
...
```

### Using xrpl.js with Vite React

Starting in 3.0 xrpl and all the packages in this repo no longer require custom configurations (ex. polyfills) to run.
