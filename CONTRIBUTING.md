# Contributing

## Set up your dev environment

We use Node v14 for development - that is the version that our linters require.

To set up the repository:
1. Clone the repository
2. `cd` into the repository
3. Install dependencies with `npm install`

To build the library:
```bash
npm install
npm run build
```

### Run the linter

```bash
npm install
npm run lint
```

## Running Tests

### Unit Tests

```bash
npm install
npm test
```

### Integration Tests

```bash
npm install
npm run test:integration
```

### Browser Tests

There are two ways to run browser tests.

One is in the browser - run `npm run build:browserTests` and open `test/localIntegrationRunner.html` in your browser.

The other is in the command line (this is what we use for CI) -

```bash
npm run build:browserTests
npm run test:browser
```

## Generate reference docs

You can see the complete reference documentation at [`xrpl.js` docs](js.xrpl.org). You can also generate them locally using `typedoc`:

```bash
npm run docgen
```

## Release process

### Editing the Code

* Your changes should have unit and/or integration tests.
* Your changes should pass the linter.
* Your code should pass all the tests on Github (which check the linter, unit and integration tests on Node 12/14/16, and browser tests).
* Open a PR against `develop` and ensure that all CI passes.
* Get a full code review from one of the maintainers.
* Merge your changes.

### Release

1. Run integration tests on `master`, using [Github Actions](https://github.com/XRPLF/xrpl-py/actions/workflows/integration_test.yml), which runs them on all 3 versions of Python.
2. Create a branch off master that properly increments the version in `pyproject.toml` and updates the `CHANGELOG` appropriately. We follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
3. Merge this branch into `master`.
4. Run integration tests on `master` again just in case.
5. Create a new Github release/tag off of this branch.
6. Locally build and download the package.
    1. Pull master locally.
    2. Locally download the package by running `pip install path/to/local/xrpl-py/dist/.whl`
    3. Make sure that this local installation works as intended, and that changes are reflected properly
7. Run `poetry publish --dry-run` and make sure everything looks good
8. Publish the update by running `poetry publish`
    * This will require entering PyPI login info

## Mailing Lists
We have a low-traffic mailing list for announcements of new `xrpl.js` releases. (About 1 email every couple of week)

+ [Subscribe to xrpl-announce](https://groups.google.com/g/xrpl-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

+ [Subscribe to ripple-server](https://groups.google.com/g/ripple-server)
