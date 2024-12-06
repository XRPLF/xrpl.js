# Contributing

### High Level Process to Contribute Code

- You should open a PR against `main` and ensure that all CI passes.
- Your changes should have [unit](#unit-tests) and/or [integration tests](#integration-tests).
- Your changes should [pass the linter](#run-the-linter).
- You should get a full code review from two of the maintainers.
- Then you can merge your changes. (Which will then be included in the next release)

## Set up your dev environment

### Requirements

We use Node v18 for development - that is the version that our linters require.
You must also use `npm` v7. You can check your `npm` version with:

```bash
npm -v
```

If your `npm` version is too old, use this command to update it:

```bash
npm -g i npm@7
```

### Set up

1. Clone the repository
2. `cd` into the repository
3. Install dependencies with `npm install`

### Build

```bash
npm run build
```

## Run the linter

```bash
npm install
npm run build
npm run lint
```

## Running Tests

For integration and browser tests, we use a `rippled` node in standalone mode to test xrpl.js code against. To set this up, you can either configure and run `rippled` locally, or set up the Docker container `rippleci/rippled` by [following these instructions](#integration-tests). The latter will require you to [install Docker](https://docs.docker.com/get-docker/).

### Unit Tests

```bash
npm install
npm run build
npm test
```

### Integration Tests

From the top-level xrpl.js folder (one level above `packages`), run the following commands:

```bash
npm install
# sets up the rippled standalone Docker container - you can skip this step if you already have it set up
docker run  -p 6006:6006 --rm -it --name rippled_standalone --volume $PWD/.ci-config:/etc/opt/ripple/ --entrypoint bash rippleci/rippled:2.3.0-rc1 -c 'rippled -a'
npm run build
npm run test:integration
```

Breaking down the command:
* `docker run -p 6006:6006` starts a Docker container with an open port for admin WebSocket requests.
 `--rm` tells docker to close the container after processes are done running.
* `-it` allows you to interact with the container.
   `--name rippled_standalone` is an instance name for clarity
* `--volume $PWD/.ci-config:/etc/opt/ripple/` identifies the `rippled.cfg` and `validators.txt` to import. It must be an absolute path, so we use `$PWD` instead of `./`.
* `rippleci/rippled` is an image that is regularly updated with the latest `rippled` releases
* `--entrypoint bash rippleci/rippled:2.3.0-rc1` manually overrides the entrypoint (for versions of rippled >= 2.3.0)
*  `-c 'rippled -a'` provides the bash command to start `rippled` in standalone mode from the manual entrypoint

### Browser Tests

There are two ways to run browser tests.

One is in the browser - run `npm run build:browserTests` and open `test/localIntegrationRunner.html` in your browser.

The other is in the command line (this is what we use for CI) -

This should be run from the `xrpl.js` top level folder (one above the `packages` folder).

```bash
npm run build
# sets up the rippled standalone Docker container - you can skip this step if you already have it set up
docker run  -p 6006:6006 --rm -it --name rippled_standalone --volume $PWD/.ci-config:/etc/opt/ripple/ --entrypoint bash rippleci/rippled:2.3.0-rc1 -c 'rippled -a'
npm run test:browser
```

## High Level Architecture

This is a monorepo, which means that there are multiple packages in a single GitHub repository using [Lerna](https://lerna.js.org/).

The 4 packages currently here are:

1. xrpl.js - The client library for interacting with the ledger.
2. ripple-binary-codec - A library for serializing and deserializing transactions for the ledger.
3. ripple-keypairs - A library for generating and using cryptographic keypairs.
4. ripple-address-codec - A library for encoding and decoding XRP Ledger addresses and seeds.
5. isomorphic - A collection of isomorphic implementations of crypto and utility functions.
6. secret-numbers - Generate XRPL Accounts with a number-based secret: 8 chunks of 6 digits.

Each package has it's own README which dives deeper into what it's main purpose is, and the core functionality it offers.
They also run tests independently as they were originally in separate repositories.

These are managed in a monorepo because often a change in a lower-level library will also require a change in xrpl.js, and so it makes sense to be able to allow for modifications of all packages at once without coordinating versions across multiple repositories.

Let's dive a bit into how xrpl.js is structured!

### The File Structure

Within the xrpl package, each folder has a specific purpose:

**Client** - This contains logic for handling the websocket connection to rippled servers.
**Models** - These types model LedgerObjects, Requests/Methods, and Transactions in order to give type hints and nice errors for users.
**Sugar** - This is where handy helper functions end up, like `submit`, `autofill`, and `getXRPBalance` amongst others.
**Utils** - These are shared functions which are useful for conversions, or internal implementation details within the library.
**Wallet** - This logic handles managing keys, addresses, and signing within xrpl.js

### Writing Tests for xrpl.js

For every file in `src`, we try to have a corresponding file in `test` with unit tests.

The goal is to maintain above 80% code coverage, and generally any new feature or bug fix should be accompanied by unit tests, and integration tests if applicable.

For an example of a unit test, check out the [autofill tests here](./packages/xrpl/test/client/autofill.test.ts).

If your code connects to the ledger (ex. Adding a new transaction type) it's handy to write integration tests to ensure that you can successfully interact with the ledger. Integration tests are generally run against a docker instance of rippled which contains the latest updates. Since standalone mode allows us to manually close ledgers, this allows us to run integration tests at a much faster rate than if we had to wait 4-5 seconds per transaction for the ledger to validate the transaction. [See above](#running-tests) for how to start up the docker container to run integration tests.

All integration tests should be written in the `test/integration` folder, with new `Requests` and `Transactions` tests being in their respective folders.

For an example of how to write an integration test for `xrpl.js`, you can look at the [Payment integration test](./packages/xrpl/test/integration/transactions/payment.test.ts).

## Generate reference docs

You can see the complete reference documentation at [`xrpl.js` docs](https://js.xrpl.org). You can also generate them locally using `typedoc`:

```bash
npm run docgen
```

This updates `docs/` at the top level, where GitHub Pages looks for the docs.

## Update `definitions.json`

Use [this repo](https://github.com/RichardAH/xrpl-codec-gen) to generate a new `definitions.json` file from the rippled source code. Instructions are available in that README.

## Adding and removing packages

`xrpl.js` uses `lerna` and `npm`'s workspaces features to manage a monorepo.
Adding and removing packages requires a slightly different process than normal
as a result.

### Adding or removing development dependencies

`xrpl.js` strives to use the same development dependencies in all packages.
You may add and remove dev dependencies like normal:

```bash
### adding a new dependency
npm install --save-dev abbrev
### removing a dependency
npm uninstall --save-dev abbrev
```

### Adding or removing runtime dependencies

You need to specify which package is changing using the `-w` flag:

```bash
### adding a new dependency to `xrpl`
npm install abbrev -w xrpl
### adding a new dependency to `ripple-keypairs`
npm install abbrev -w ripple-keypairs
### removing a dependency
npm uninstall abbrev -w xrpl
```

## Updating the Docker container for CI

In order to test the library, we need to enable the latest amendments in the docker container.
This requires updating the `/.ci-config/rippled.cfg` file with the hashes and names of new amendments.

In order to update the list, follow these steps from the top level of the library:
1. Run `node ./.ci-config/getNewAmendments.js`
2. If there are any new amendment hashes, add a comment to the end of `/.ci-config/rippled.cfg` with the date
   - `Ex. "# Added August 9th, 2023"`
3. For each hash printed out by the script, add the hash and name to the config file.
   - Ex. `B2A4DB846F0891BF2C76AB2F2ACC8F5B4EC64437135C6E56F3F859DE5FFD5856 ExpandedSignerList`
   - You can look up the name by searching for the hash on https://xrpl.org/known-amendments.html
4. Push your changes

Note: The same updated config can be used to update xrpl-py's CI as well.

## Updating `definitions.json`

This should almost always be done using the [`xrpl-codec-gen`](https://github.com/RichardAH/xrpl-codec-gen) script - if the output needs manual intervention afterwards, consider updating the script instead.

1. Clone / pull the latest changes from [rippled](https://github.com/XRPLF/rippled) - Specifically the `develop` branch is usually the right one.
2. Clone / pull the latest changes from [`xrpl-codec-gen`](https://github.com/RichardAH/xrpl-codec-gen)
3. From the `xrpl-codec-gen` tool, follow the steps in the `README.md` to generate a new `definitions.json` file.
4. Replace the `definitions.json` file in the `ripple-binary-codec` with the newly generated file.
5. Verify that the changes make sense by inspection before submitting, as there may be updates required for the `xrpl-codec-gen` tool depending on the latest amendments we're updating to match.


## Release process + checklist

## PR process

- [ ] Your changes should be on a branch.
- [ ] Your changes should have unit tests.
- [ ] Lint the code with `npm lint`
- [ ] Build your code with `npm build`
- [ ] Run the unit tests with `npm test`
- [ ] Get a full code review.
- [ ] Merge your branch into `main` and push to github.
- [ ] Ensure that all tests passed on the last CI that ran on `main`.

## Release

1. Checkout `main` (or your beta branch) and `git pull`.
1. Create a new branch (`git checkout -b <BRANCH_NAME>`) to capture updates that take place during this process.
1. Update `HISTORY.md` to reflect release changes.

   - [ ] Update the version number and release date, and ensure it lists the changes since the previous release.

1. Run `npm run docgen` if the docs were modified in this release to update them (skip this step for a beta).
1. Run `npm run build` to triple check the build still works
1. Run `npx lerna version --no-git-tag-version` - This bumps the package versions.

   - For each changed package, pick what the new version should be. Lerna will bump the versions, commit version bumps to `main`, and create a new git tag for each published package.
   - If you do NOT want to update the package number, choose "Custom Version" and set the version to be the same as the existing version. Lerna will not publish any changes in this case.
   - If publishing a beta, make sure that the versions are all of the form `a.b.c-beta.d`, where `a`, `b`, and `c` are identical to the last normal release except for one, which has been incremented by 1.

1. Run `npm i` to update the package-lock with the updated versions.
1. Create a new PR from this branch into `main` and merge it (you can directly merge into the beta branch for a beta).
1. Checkout `main` and `git pull` (you can skip this step for a beta since you already have the latest version of the beta branch).
1. Actually publish the packages with one of the following:

   - Stable release: Run `npx lerna publish from-package --yes`
   - Beta release: Run `npx lerna publish from-package --dist-tag beta --yes`
     Notice this allows developers to install the package with `npm add xrpl@beta`

1. If requested, enter your [npmjs.com](https://npmjs.com) OTP (one-time password) to complete publication.

   NOW YOU HAVE PUBLISHED! But you're not done; we have to notify people!

1. Run `git tag <tagname> -m <tagname>`, where `<tagname>` is the new package and version (e.g. `xrpl@2.1.1`), for each version released.
1. Run `git push --follow-tags`, to push the tags to Github.
1. On GitHub, click the "Releases" link on the right-hand side of the page.

1. Repeat for each release:

   1. Click "Draft a new release"
   1. Click "Choose a tag", and choose a tag that you just created.
   1. Edit the name of the release to match the tag (IE \<package\>@\<version\>) and edit the description as you see fit.

1. Send an email to [xrpl-announce](https://groups.google.com/g/xrpl-announce).
1. Lastly, send a similar message to the XRPL Discord in the [`javascript` channel](https://discord.com/channels/886050993802985492/886053111179915295). The message should include:
   1. The version changes for xrpl libraries
   1. A link to the more detailed changes
   1. Highlights of important changes


## Mailing Lists

We have a low-traffic mailing list for announcements of new `xrpl.js` releases. (About 1 email every couple of weeks)

- [Subscribe to xrpl-announce](https://groups.google.com/g/xrpl-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

- [Subscribe to ripple-server](https://groups.google.com/g/ripple-server)
