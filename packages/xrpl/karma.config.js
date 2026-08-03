const fs = require('fs')
const path = require('path')

const baseKarmaConfig = require('../../karma.config')
const webpackConfig = require('./test/webpack.config')
delete webpackConfig.entry

// The @xrplf/mpt-crypto ESM glue locates its wasm via new URL(import.meta.url),
// so webpack emits mpt_crypto.wasm as a hashed asset that karma's static file
// server doesn't know to serve (404). Stream any *.wasm from the webpack output
// dir at request time so the confidential specs can load the crypto in-browser.
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
  // Apply the shared base first: it sets `plugins`, which the override below
  // extends with the wasm middleware.
  baseKarmaConfig(config)

  config.set({
    webpack: webpackConfig,
    files: ['build/xrpl-latest.js', 'test/integration/**/*.test.ts'],

    // The confidential MPT 4-party lifecycle test drives the whole flow (all
    // five transaction types + auditor disclosure) in a single ~40s it() that
    // emits nothing mid-run. Keep karma's no-activity window above that spec's
    // own 80s jasmine timeout so jasmine — not karma — fails a genuinely stuck
    // run (karma's default is 30s, which disconnects mid-spec).
    browserNoActivityTimeout: 100000,

    plugins: [
      'karma-webpack',
      'karma-jasmine',
      'karma-chrome-launcher',
      { 'middleware:wasm': ['factory', createWasmMiddleware] },
    ],
    beforeMiddleware: ['wasm'],
  })
}
