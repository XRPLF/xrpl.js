# ripple-keypairs Release History

## 1.0.3 (2021-02-22)

* Update dependencies:
  * elliptic to 6.5.4 - includes security fix, although ripple-keypairs should not be susceptible because the vulnerable code is meant only for DH key exchange, which we do not use
  * ripple-address-codec to 4.1.2
  * bn.js, ts-node, @types/node, @types/mocha, codecov, prettier, typescript, eslint-config-prettier, eslint-plugin-import, elint-config-airbnb-base, eslint-plugin-prettier, ts-node, mocha

## 1.0.2 (2020-09-12)

* Drop support for Node.js version 8 (#171)
  * Node.js v8 reached End-of-Life on 31st December 2019. As ripple-keypairs is a security-sensitive library, we recommend upgrading to Node.js 10 or higher immediately. ([Node.js Releases](https://nodejs.org/en/about/releases/))
* Internal
  * Update dependencies (#170) (#163) (#173) (#172) (#175) (#177) (#179) (#180) (#181)
  * Bump elliptic from 6.5.2 to 6.5.3 (#190)
    * We do not believe that the issue fixed in this patch affects ripple-keypairs in any way, but we are bumping the dependency just to stay up-to-date.
  * Bump lodash from 4.17.15 to 4.17.20 (#207)
* Add GitHub Actions CI (#221)

## 1.0.1 (2020-05-12)

* Update dependencies
  * codecov, eslint-config-airbnb-typescript, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, @types/node, eslint-plugin-mocha, typescript, mocha
* This will probably be the last version to support Node.js version 8, which reached End-of-Life on 31st December 2019. If you are still using Node.js 8, we recommend upgrading to version 10 or higher as soon as possible. ([Node.js Releases](https://nodejs.org/en/about/releases/))

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
