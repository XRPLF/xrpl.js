# Contributing

## Set up your dev environment

### Requirements

We use Node v14 for development - that is the version that our linters require.
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
For integration and browser tests, we use a `rippled` node in standalone mode to test xrpl.js code against. To set this up, you can either run `rippled` locally, or set up the Docker container `natenichols/rippled-standalone:latest` for this purpose. The latter will require you to [install Docker](https://docs.docker.com/get-docker/).

### Unit Tests

```bash
npm install
npm run build
npm test
```

### Integration Tests

```bash
npm install
# sets up the rippled standalone Docker container - you can skip this step if you already have it set up
docker run -p 6006:6006 -it natenichols/rippled-standalone:latest
npm run build
npm run test:integration
```

### Browser Tests

There are two ways to run browser tests.

One is in the browser - run `npm run build:browserTests` and open `test/localIntegrationRunner.html` in your browser.

The other is in the command line (this is what we use for CI) -

```bash
npm run build
# sets up the rippled standalone Docker container - you can skip this step if you already have it set up
docker run -p 6006:6006 -it natenichols/rippled-standalone:latest
npm run test:browser
```

## Generate reference docs

You can see the complete reference documentation at [`xrpl.js` docs](js.xrpl.org). You can also generate them locally using `typedoc`:

```bash
npm run docgen
```

After generating the docs, copy the docs from `packages/xrpl/docs` to `docs` at the top level.
(That is where GitHub pages looks for the docs, if the docs aren't moved, js.xrpl.org will NOT update)

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

## Release process

### Editing the Code

* Your changes should have unit and/or integration tests.
* Your changes should pass the linter.
* Your code should pass all the tests on Github (which check the linter, unit and integration tests on Node 12/14/16, and browser tests).
* Open a PR against `main` and ensure that all CI passes.
* Get a full code review from one of the maintainers.
* Merge your changes.

### Release

1. Ensure that all tests passed on the last CI that ran on `main`.
2. Open a PR to update the docs if docs were modified.
___
NOW WE ARE READY TO PUBLISH! No new code changes happen manually now.
___
3. Checkout `main` and `git pull`.
4. Create a new branch to capture updates that take place during this process. `git checkout -b <BRANCH_NAME>`
5. Run `npm run build` to triple check the build still works
6. Run `npx lerna version --no-git-tag-version` - This creates a draft PR and release tags for the new version.
7. For each changed package, pick what the new version should be. Lerna will bump the versions, commit version bumps to `main`, and create a new git tag for each published package.
8. Run `npm i` to update the package-lock with the updated versions
9. Create a new PR from this branch into `main` and merge it.
10. Checkout `main` and `git pull`
11. Run `npx lerna publish from-package --yes` - This will actually publish the packages.
12. If it asks for it, enter your [npmjs.com](https://npmjs.com) OTP (one-time password) to complete publication.
13. Create a new branch to capture the updated packages from the release (`git checkout -b <BRANCH_NAME>`)
14. Make a PR to merge those changes into `main`

___
NOW YOU HAVE PUBLISHED! But you're not done; we have to notify people!
___
15. On github, click the "releases" link on the right-hand side of the page.
16. Click "Draft a new release"
17. Click "Choose a tag" then type in the name of a repo `@` it's newest version to create a new tag (Ex. xrpl@2.0.3)
18. Edit the name of the release to match the tag (IE \<package\>@\<version\>) and edit the description as you see fit.
19. Send an email to [xrpl-announce](https://groups.google.com/g/xrpl-announce).

## Mailing Lists
We have a low-traffic mailing list for announcements of new `xrpl.js` releases. (About 1 email every couple of weeks)

+ [Subscribe to xrpl-announce](https://groups.google.com/g/xrpl-announce)

If you're using the XRP Ledger in production, you should run a [rippled server](https://github.com/ripple/rippled) and subscribe to the ripple-server mailing list as well.

+ [Subscribe to ripple-server](https://groups.google.com/g/ripple-server)
