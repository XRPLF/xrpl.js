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
4. Run `npm install` to update package-lock.json. **Do NOT delete package-lock.json and regenerate from scratch** — this can change hoisted dependency resolution and break builds even when no versions changed.
5. Diff package.json and package-lock.json against main to classify each Dependabot PR as:
   - Upgraded: version changed
   - No-op: version was already current or newer
6. If any upgrade changes the public API of a package (new errors, changed return types, removed functionality) and result in a breaking change, add an entry under `## Unreleased` in that package's `HISTORY.md`.
7. Verify completeness: every PR from step 1 must have a status (Upgraded, No-op, or Skipped). If any PR is unaccounted for, stop and report it before proceeding.

## Step 3: Validate

Run the full test suite in order:
1. npm run build && npm run lint
2. npm test
3. Start xrpld Docker container (based on CONTRIBUTING.md):
   - Pre-run cleanup (in case a previous run left a container behind): `docker rm -f xrpld-service 2>/dev/null || true`
   - Start the container: `docker run --detach --rm --publish 6006:6006 --volume "$PWD/.ci-config:/etc/opt/xrpld/" --name xrpld-service rippleci/xrpld:develop --standalone`
   - Wait for port 6006 with a bounded timeout and halt on failure:
     ```bash
     SECONDS=0
     until nc -z localhost 6006 || [ $SECONDS -gt 120 ]; do sleep 2; done
     if ! nc -z localhost 6006; then
       echo "Error: xrpld did not start within 120s"
       docker logs xrpld-service
       exit 1
     fi
     ```
   - Run: `npm run test:integration && npm run test:browser`
   - Stop container: `docker stop xrpld-service` (auto-removed via `--rm`)
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

1. **Code changes note** — write a markdown file (`.claude/skills/batch-deps-upgrade/code-changes.md`) documenting every non-package.json source code change, explaining what broke, why, and the minimal fix applied.

2. **Commit message** — output a concise commit message the human can copy-paste into `git commit -m "..."`. Format: `chore(deps): quarterly batch dependency upgrade YYYY-QN` followed by a brief summary of upgrades, skips, and removals.

3. **PR description** — write a markdown file (`.claude/skills/batch-deps-upgrade/pr-description.md`) following the repo's PR template (.github/pull_request_template.md):
   - For "Type of Change", determine dynamically:
     - Check "Breaking change" ONLY if the upgrade visibly changes the library's public API (e.g., error messages, return types, removed functions). This aligns with whether a `HISTORY.md` entry was added in Step 2.6.
     - Otherwise, do not check any Type of Change — dependency upgrades are maintenance and don't fit "Refactor" (which means restructuring code without behavior change). Note in the PR body that the upgrade is maintenance.
   - Include a "Superseded Dependabot PRs" section with a table: PR (linked), Package, From, To, Status, MajorVersionUpgrade
     - Status values: Upgraded, No-op (reason), Skipped (peer dep conflict / CI failure: error)
     - MajorVersionUpgrade: `No` if the major version number did not change. Otherwise `Yes` plus a link for each major version crossed. For example, 7.x → 9.x yields `Yes ([v8](url), [v9](url))`. Each link should point to the package's release notes or changelog for that major version. Verify each link returns HTTP 200 and has meaningful content (e.g., `curl -sL -o /dev/null -w "%{http_code}" <url>`); if a package doesn't publish per-version GitHub releases (e.g., TypeScript sometimes skips `x.0.0`/`x.0.1` tags, bignumber.js puts details in CHANGELOG.md), fall back to the CHANGELOG.md file or the closest valid release tag.
   - Closing instructions with two paragraphs:
     1. "After merging, close the following superseded PRs (Skipped ones remain open for future handling): #X, #Y, #Z" — list only Upgraded and No-op PRs.
     2. "The following PRs were Skipped and should remain open: #A (package-a), #B (package-b), ..." — annotate each with the package name. These stay open so Dependabot keeps rebasing them.
