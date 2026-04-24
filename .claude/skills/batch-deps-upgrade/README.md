# Batch Dependency Upgrade

Batches all open Dependabot PRs into a single upgrade PR.

## Prerequisites

- `gh auth login` -- needed to list open Dependabot PRs
- Docker daemon running -- the skill starts a rippled container for integration/browser tests

## Usage

From the xrpl.js repo root, start a new Claude Code session and run:

```
/batch-deps-upgrade
```

## What it does

1. Discovers all open Dependabot PRs via `gh pr list`
2. Applies upgrades to package.json files, runs `npm install`
3. Validates with build, lint, unit tests, integration tests, browser tests and faucet tests
4. Generates output files and a commit message for the human to use

## After it finishes

1. Review the changes and generated files. Ask Claude questions about specific changes if they don't make sense — the code changes may need multiple rounds of discussion and correction before they're ready.
2. Stage and commit using the suggested commit message (the skill already creates a branch)
3. Push and open a PR using the generated PR description
4. After merge, close the superseded Dependabot PRs listed in the description
