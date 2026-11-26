/* eslint-disable */
// Finalize the ESM build (dist/esm): mark it `type: module` and add `.js` to
// relative import specifiers. The TS sources stay extensionless (so the CJS build's
// classic resolution and Jest are untouched), but a `type: module` tree is strict —
// Node ESM and webpack reject extensionless relatives — so we rewrite the emitted
// output only. Bare specifiers like the `./wasm` subpath aren't matched, so the
// glue keeps routing through package.json `exports`.
const fs = require('fs')
const path = require('path')

const esmDir = path.join(__dirname, '..', 'dist', 'esm')

const RELATIVE_SPECIFIER =
  /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]+?)(['"])/gu

function addJsExtensions(code) {
  return code.replace(
    RELATIVE_SPECIFIER,
    (match, prefix, openQuote, specifier, closeQuote) => {
      if (/\.(?:c|m)?js$|\.json$/u.test(specifier) || specifier.endsWith('/')) {
        return match
      }
      return `${prefix}${openQuote}${specifier}.js${closeQuote}`
    },
  )
}

for (const entry of fs.readdirSync(esmDir)) {
  if (!entry.endsWith('.js')) {
    continue
  }
  const file = path.join(esmDir, entry)
  fs.writeFileSync(file, addJsExtensions(fs.readFileSync(file, 'utf8')))
}

fs.writeFileSync(
  path.join(esmDir, 'package.json'),
  `${JSON.stringify({ type: 'module' }, null, 2)}\n`,
)
