# ripple-keypairs Release History

## 1.0.0 (2020-02-05)

* Refactor and use TypeScript
* Use Travis CI (.travis.yml)
* Use "dist/*" for distribution files
* Add yarn.lock
* Export members and add default export
* Internal
  * Use published ripple-address-codec (#58)
  * Replace TSLint with ESLint + Prettier (#71)
  * Add type (#74)
  * Remove unused code (#81)
  * Add tests (#82)
  * Improve comments (#90)
  * Remove Babel (#33)
* Update dependencies
  * @types/node, eslint, bn.js, typescript, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, mocha, istanbul, hash.js

## 0.11.0 (2018-10-23)

* Upgrade elliptic (#28)

## 0.10.2

* Remove unused devDependencies

## 0.10.1 (2017-11-10)

* [Verify that generated keypairs can correctly sign a message](https://github.com/ripple/ripple-keypairs/pull/22)
