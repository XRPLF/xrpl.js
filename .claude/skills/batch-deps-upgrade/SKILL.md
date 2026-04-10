---
name: batch-deps-upgrade
description: Batch all open Dependabot dependency upgrade PRs into a single PR
disable-model-invocation: true
---

Batch all open Dependabot dependency upgrade PRs into a single PR for this repository.

## Step 1: Discover

Run: gh pr list --repo XRPLF/xrpl.js --label dependencies --state open --limit 500 --json number,title,headRefName,body,url

Parse each PR to extract package names and versions. Dependabot PRs come in two formats:
- **Single-package PRs**: title is `Bump <pkg> from <old> to <new>` — parse from title
- **Grouped PRs** (e.g. #3266, #3051, #3013): title is `bump <pkg1> and <pkg2>` with no versions — parse from PR body, which contains a structured list of package updates with version ranges

If any PR can't be parsed from either title or body, flag it for manual review. Build a table of all proposed upgrades. Report the table to the user before proceeding.

## Step 2: Apply

1. Create a branch from main: deps/batch-deps-upgrade-YYYY-QN (use current year and quarter)
2. Check for **peer dependency conflicts** before upgrading. For each proposed upgrade, run `npm ls <pkg>` and check if any workspace package pins a peer dep that would block the upgrade (e.g., `@xrplf/eslint-config@^3` requires `eslint@^9`, blocking eslint 10). Mark these as Skipped (peer dep conflict: <details>) and do not attempt them.
3. For each remaining Dependabot PR, determine if it's a direct dep (listed in a package.json) or transitive dep (only in package-lock.json):
   - Direct deps: update the version in the relevant package.json file(s)
   - Transitive deps: run `npm update <pkg>` to update within semver range
4. Run `npx knip` to detect dependency issues:
   - **Unused dependencies**: remove them from their package.json
   - **Unlisted dependencies**: if any production code imports a package that isn't in any package.json (only available via transitive hoisting), add it as an explicit dependency in the relevant package.json to prevent hoisting breakage
5. Run `npm install` to update package-lock.json. **Do NOT delete package-lock.json and regenerate from scratch** — this can change hoisted dependency resolution and break builds even when no versions changed.
6. Diff package.json and package-lock.json against main to classify each Dependabot PR as:
   - Upgraded: version changed
   - No-op: version was already current or newer
   - Removed: dependency was unused and removed
7. If any upgrade changes the public API of a package (new errors, changed return types, removed functionality) and result in a breaking change, add an entry under `## Unreleased` in that package's `HISTORY.md`.
8. Verify completeness: every PR from step 1 must have a status (Upgraded, No-op, Removed, or Skipped). If any PR is unaccounted for, stop and report it before proceeding.

## Step 3: Validate

Run the full test suite in order:
1. npm run build && npm run lint
2. npm test
3. Start rippled Docker container (based on CONTRIBUTING.md, with `--detach` instead of `-it` for automation):
   docker run --detach --rm -p 6006:6006 --volume "$PWD/.ci-config/":/etc/opt/ripple/ --name rippled_standalone --entrypoint bash rippleci/rippled:develop -c "mkdir -p /var/lib/rippled/db/ && rippled -a"
   Wait for healthy, then run: npm run test:integration && npm run test:browser
   Stop container: docker stop rippled_standalone
4. npm run test:faucet

If any step fails, **attempt to fix the breaking change with code modifications before rolling back**. Common patterns:

- **BigNumber.js major bumps**: v10+ throws on invalid input instead of returning NaN. Wrap `new BigNumber(val)` calls in try-catch where the code previously checked for NaN.
- **ESM-only packages** (e.g., https-proxy-agent): Add transform entries and `transformIgnorePatterns` exclusions in `jest.config.base.js` so Jest can parse ESM imports.
- **Type compatibility** (e.g., @scure/base 2.0 changing Uint8Array generics): Widen variable type annotations (e.g., `let buf: Uint8Array = ...` instead of `let buf = ...`).
- **Hoisting breakage** (e.g., webpack-merge): If a transitive dep's major version is shadowed by a different transitive dep's older version, add the correct version as an explicit dependency.

Only roll back and mark as Skipped if:
- The fix requires a large-scale migration (e.g., TypeScript moduleResolution changes across the entire monorepo)
- The upgrade is blocked by an external peer dependency constraint you cannot update

If a failure persists after investigation and you cannot identify a fix, roll back the upgrade and mark it as Skipped. Re-run validation until green.

## Step 4: Generate Outputs

Do NOT commit or create a PR. Instead, generate the following outputs for the human to use:

1. **Code changes explanation** — write a markdown file (`.claude/skills/batch-deps-upgrade/code-changes.md`) documenting every non-package.json source code change, explaining what broke, why, and the minimal fix applied.

2. **Commit message** — output a concise commit message the human can copy-paste into `git commit -m "..."`. Format: `chore(deps): quarterly batch dependency upgrade YYYY-QN` followed by a brief summary of upgrades, skips, and removals.

3. **PR description** — write a markdown file (`.claude/skills/batch-deps-upgrade/pr-description.md`) following the repo's PR template (.github/pull_request_template.md):
   - For "Type of Change", determine dynamically:
     - Check "Breaking change" if any production dependency has a major version bump
     - Check "Refactor" if all upgrades are minor/patch or only affect devDependencies
   - Include a "Superseded Dependabot PRs" section with a table: PR (linked), Package, From, To, Status
     - Status values: Upgraded, No-op (reason), Removed (unused per `knip`), Skipped (peer dep conflict / CI failure: error)
   - Section listing any unused deps removed, with `knip` justification
   - Closing instructions: "After merging, close the following PRs: #X, #Y, #Z"
