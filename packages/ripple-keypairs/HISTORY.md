# ripple-keypairs Release History

## 1.0.0-beta.1 (2020-01-28)

* Internal
  * Travis: remove node 6 and add node 13 (#59)
  * Use published ripple-address-codec (#58)
  * Replace TSLint with ESLint + Prettier (#71)
  * Add type (#74)
  * Remove unused code (#81)
  * Add tests (#82)
  * Improve comments (#90)
  * Remove Babel (#33)
* Update dependencies
  * @types/node, eslint, bn.js, typescript, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, mocha, istanbul, hash.js

## 1.0.0-beta.0 (2019-10-17)

* Refactor and use TypeScript
* Vendor ripple-address-codec (move dependency into this project)
* Add support for Travis CI (.travis.yml)
* Use "dist/*" for distribution files
* Add yarn.lock

## 0.11.0 (2018-10-23)

* Upgrade elliptic (#28)

## 0.10.2

* Remove unused devDependencies

## 0.10.1 (2017-11-10)

* [Verify that generated keypairs can correctly sign a message](https://github.com/ripple/ripple-keypairs/pull/22)
