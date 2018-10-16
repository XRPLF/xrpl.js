# ripple-lib

A JavaScript API for interacting with the XRP Ledger

[![NPM](https://nodei.co/npm/ripple-lib.png)](https://www.npmjs.org/package/ripple-lib)

### Features

+ Connect to a `rippled` server from Node.js or a web browser
+ Issue [rippled API](https://ripple.com/build/rippled-apis/) requests
+ Listen to events on the XRP Ledger (transaction, ledger, etc.)
+ Sign and submit transactions to the XRP Ledger
+ Type definitions for TypeScript

## Getting Started

See also: [RippleAPI Beginners Guide](https://ripple.com/build/rippleapi-beginners-guide/)

You can use `npm`, but we recommend using `yarn` for the added assurance provided by `yarn.lock`.

+ [Yarn Installation Instructions](https://yarnpkg.com/en/docs/install)

Install `ripple-lib`:
```
$ yarn add ripple-lib
```

Then see the [documentation](https://github.com/ripple/ripple-lib/blob/develop/docs/index.md) and [code samples](https://github.com/ripple/ripple-lib/tree/develop/docs/samples).

### Mailing Lists

We have a low-traffic mailing list for announcements of new ripple-lib releases. (About 1 email per week)

+ [Subscribe to ripple-lib-announce](https://groups.google.com/forum/#!forum/ripple-lib-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

+ [Subscribe to ripple-server](https://groups.google.com/forum/#!forum/ripple-server)

## Development

To build the library for Node.js:
```
$ yarn compile
```

The TypeScript compiler will [output](./tsconfig.json#L7) the resulting JS files in `./dist/npm/`.

To build the library for the browser:
```
$ yarn build
```

Gulp will [output](./Gulpfile.js) the resulting JS files in `./build/`.

For more details, see the `scripts` in `package.json`.

## Running Tests

1. Clone the repository
2. `cd` into the repository and install dependencies with `yarn install`
3. `yarn test`

## Generating Documentation

The continuous integration tests require that the documentation stays up-to-date. If you make changes to the JSON schemas, fixtures, or documentation sources, you must update the documentation by running `yarn run docgen`.

`npm` may be used instead of `yarn` in the commands above.

## More Information

+ [Ripple Developer Center](https://ripple.com/build/)
