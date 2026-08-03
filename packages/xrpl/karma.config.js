const fs = require('fs')
const path = require('path')

const baseKarmaConfig = require('../../karma.config')
const webpackConfig = require('./test/webpack.config')
delete webpackConfig.entry

// The @xrplf/mpt-crypto ESM glue locates its wasm via new URL(import.meta.url),
// so webpack emits mpt_crypto.wasm as a hashed asset — but karma only serves files
// in its `files` list, so the browser's fetch 404s. Stream any *.wasm from the
// webpack output dir at request time (race-free: it's emitted before the browser
// asks). This is what lets the Confidential MPT suite run in a real browser.
const WASM_OUTPUT_DIR = path.join(__dirname, 'test', 'testCompiledForWeb')
function createWasmMiddleware() {
  return function wasmMiddleware(req, res, next) {
    const url = req.url.split('?')[0]
    if (url.endsWith('.wasm')) {
      const file = path.join(WASM_OUTPUT_DIR, path.basename(url))
      if (fs.existsSync(file)) {
        res.setHeader('Content-Type', 'application/wasm')
        fs.createReadStream(file).pipe(res)
        return
      }
    }
    next()
  }
}

module.exports = function (config) {
  // Apply the shared base first, then override — base sets `plugins`, so the
  // wasm middleware plugin has to be registered after it (not before).
  baseKarmaConfig(config)

  config.set({
    webpack: webpackConfig,
    files: ['build/xrpl-latest.js', 'test/integration/**/*.test.ts'],

    plugins: [
      'karma-webpack',
      'karma-jasmine',
      'karma-chrome-launcher',
      { 'middleware:wasm': ['factory', createWasmMiddleware] },
    ],
    beforeMiddleware: ['wasm'],
  })
}
