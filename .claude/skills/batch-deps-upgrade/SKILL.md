---
name: batch-deps-upgrade
description: Batch all open Dependabot dependency upgrade PRs into a single PR, plus any further upgrades needed to resolve open Semgrep JIRA tickets that a package upgrade can fix
disable-model-invocation: true
---

Batch all open Dependabot dependency upgrade PRs into a single PR for this repository, **plus any further upgrades needed to resolve the open Semgrep JIRA tickets that a package upgrade can fix**.

**Scope — only tickets a package upgrade can fix:** ones naming a vulnerable dependency and a version that fixes it.

Within that scope, the two inputs are independent. Every in-scope ticket gets fixed whether or not a Dependabot PR happens to propose that upgrade. Where no open Dependabot PR covers an impacted package, this PR adds the upgrade itself.

Two modes:

- **Default** (`/batch-deps-upgrade`) — Steps 1-4 below. Writes nothing to JIRA or GitHub; it changes the working tree and writes local files only.
- **`close`** (`/batch-deps-upgrade close`) — skip Steps 1-4 entirely and run only **Closing run** under "Semgrep tickets" below. Normally used after the batch PR merges.

Requires `gh auth login` and, for the Semgrep parts, the Atlassian MCP.

## Step 1: Discover

Run: gh pr list --repo XRPLF/xrpl.js --label dependencies --state open --limit 500 --json number,title,headRefName,body,url

Parse each PR to extract package names and versions. Dependabot PRs come in two formats:
- **Single-package PRs**: title is `Bump <pkg> from <old> to <new>` — parse from title
- **Grouped PRs** (e.g. #3266, #3051, #3013): title is `bump <pkg1> and <pkg2>` with no versions — parse from PR body, which contains a structured list of package updates with version ranges

If any PR can't be parsed from either title or body, flag it for manual review. Build a table of all proposed upgrades. Report the table to the user before proceeding.

Also fetch the Semgrep tickets per **Where the list comes from** under "Semgrep tickets" below, and add them to the same table.

## Step 2: Apply

1. Create a branch from main: deps/batch-deps-upgrade-YYYY-QN (use current year and quarter)
2. Check for **peer dependency conflicts** before upgrading. For each proposed upgrade, run `npm ls <pkg>` and check if any workspace package pins a peer dep that would block the upgrade (e.g., `@xrplf/eslint-config@^3` requires `eslint@^9`, blocking eslint 10). Mark these as Skipped (peer dep conflict: <details>) and do not attempt them.
3. For each remaining upgrade, determine if it's a direct dep (listed in a package.json) or transitive dep (only in package-lock.json):
   - Direct deps: update the version in the relevant package.json file(s)
   - Transitive deps: run `npm update <pkg>` to update within semver range
   - Never add `overrides` or widen a parent's declared range to force a resolution — that risks breaking a parent which never declared support for the new version. An install that can't reach its target within range is Skipped, naming the blocking parent.
4. Run `npm install` to update package-lock.json. **Do NOT delete package-lock.json and regenerate from scratch** — this can change hoisted dependency resolution and break builds even when no versions changed.
5. Diff package.json and package-lock.json against main to classify each Dependabot PR **and each Semgrep ticket** as:
   - Upgraded: version changed
   - No-op: version was already current or newer

   For tickets, see **Picking the target and matching results** under "Semgrep tickets" below — several tickets can share one install, and the match is per ticket.
6. If any upgrade changes the public API of a package (new errors, changed return types, removed functionality) and result in a breaking change, add an entry under `## Unreleased` in that package's `HISTORY.md`.
7. Verify completeness: every PR and every ticket from step 1 must have a status (Upgraded, No-op, or Skipped). If any is unaccounted for, stop and report it before proceeding.

## Step 3: Validate

Run the full test suite in order:
1. npm run build && npm run lint
2. npm test
3. Start xrpld Docker container (based on CONTRIBUTING.md):
   - Pre-run cleanup (in case a previous run left a container behind): `docker rm -f xrpld-service 2>/dev/null || true`
   - Start the container: `docker run --detach --rm --publish 6006:6006 --volume "$PWD/.ci-config:/etc/xrpld/" --name xrpld-service rippleci/xrpld:develop --standalone`
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

Do NOT commit or create a PR. Instead, generate the following outputs for the human to use.

**Formatting for every generated markdown file:** one line per paragraph and one line per list item — never hard-wrap prose mid-sentence. Editors soft-wrap it anyway, and mid-paragraph breaks make later diffs noisy. Blank line between blocks, no trailing whitespace.

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
     1. "After merging, run `/batch-deps-upgrade close` to close the superseded PRs and the resolved Semgrep tickets." Follow it with the list of Upgraded and No-op PRs (#X, #Y, #Z) as a record, so the PR documents what will be closed even if the skill isn't used.
     2. "The following PRs were Skipped and should remain open: #A (package-a), #B (package-b), ..." — annotate each with the package name. These stay open so Dependabot keeps rebasing them.

4. **Semgrep close list** — write `close-list.md` per **Outputs** under "Semgrep tickets" below.

## Semgrep tickets

Treat each in-scope ticket as one more row in Step 1's table: a package plus a target version, carried through Steps 1-4 and classified Upgraded / No-op / Skipped like any Dependabot PR. Only the differences are below.

### Where the list comes from (Step 1)

Fetch open tickets via the Atlassian MCP:

```
parent = DGE-3869 AND project = DGE
AND status IN ("To Do", "in review", Blocked, "In Progress")
AND created >= "2022-01-01"
AND textfields ~ "xrpl.js"
ORDER BY rank
```

**Take the package name from the summary, not the description** — a description may list several packages sharing one advisory (e.g. DGE-8019), so it picks the wrong one. Take the fix version, severity and CVE/GHSA link from the description. Wording varies, so read for intent rather than matching labels literally.

Keep tickets naming a package and a fix version; drop the rest. If tickets came back but none of them could be parsed, that is a parsing failure — stop. If the query returned nothing, or nothing was in scope, there is simply no Semgrep work this quarter: record zero and carry on with the Dependabot batch. A ticket becomes a row whether or not a Dependabot PR proposes that package; a ticket is reason enough on its own.

### Picking the target and matching results (Step 2)

Where a ticket and a PR both want the same install, the target is the **highest** version either wants. Three matching rules — get them wrong and you close tickets whose vulnerability is still installed:

- Compare with semver, never as strings — lexically `"7.5.9" > "7.5.21"`.
- Check the install the ticket means. One package can resolve at several versions at once (`brace-expansion`), so "any install ≥ target" can answer yes off an unrelated major line. Match the install on the ticket's own major line.
- Match per ticket, not per package. Tickets sharing one install can want different versions (`tar`). Never conclude "we upgraded X, so close the X tickets".

Classify from the Step 2.5 diff, not from which PR did what: a parent bump carries along a dependency it pins exactly, so a ticket can come out Upgraded with no PR naming its package (`nx` pins `axios`).

### Outputs (Step 4)

Write `close-list.md` — the closing run's input, so keep it parseable, one item per line:

1. **Close** — every Upgraded and No-op ticket and PR. Tickets: key, package, version evidence, comment to post. PRs: number, package, version proposed, comment to post.

   Every comment must reference the batch PR, which does not exist yet at this point. Write that reference as the literal token `<PR>`; the closing run substitutes the merged PR's URL. Use a URL rather than `#1234`, which JIRA renders as plain text.
2. **Left open** — every Skipped one, with its reason. Each is a security fix that did not land, so this is worth reading. Skipped PRs stay open for Dependabot to keep rebasing.

**Do NOT commit `close-list.md`** — local scratch, like `code-changes.md` and `pr-description.md`.

So the PR body is the durable record and the closing run's fallback. In `pr-description.md`, add a **"Semgrep tickets"** table carrying per ticket its key, package, required version and status — the same fields the closing run needs, because status alone cannot be verified against `main`. Give ticket-driven upgrades that no Dependabot PR proposed their own table naming the motivating ticket — they are additions, not supersessions.

### Closing run (`/batch-deps-upgrade close`)

No discovery, no bumps, no validation. Read section 1 of `close-list.md`; if it is missing, fall back to the merged PR body's lists. Identify the batch PR from an argument or `gh pr list --repo XRPLF/xrpl.js --state merged --head <branch>`, and replace the `<PR>` token in every comment with its URL. **Check that no comment still contains `<PR>` before posting anything** — if one does, the substitution failed, so stop rather than post a placeholder onto dozens of tickets.

1. **Verify each item against the current `main`** and skip anything not genuinely satisfied — a reviewer may have had an upgrade reverted. This is what makes the run safe whether or not the batch has merged.
2. **Close everything that verified.** Do not ask for approval; the engineer reviewed both lists on the PR, and step 1 is the real check.
   - **JIRA tickets** — resolve the ticket's `Done` transition **before** commenting: query the issue's available transitions and take the one whose destination status is `Done`. Then post the comment and transition. Resolving first avoids the half-state where a ticket is commented on but left open.
   - **Dependabot PRs** — `gh pr close <n> --repo XRPLF/xrpl.js --comment "<comment>"`.
3. Report in this shape:

   ```
   Closed <n> JIRA tickets, <n> Dependabot PRs.

   Skipped — not satisfied on main @ <sha> (<n>):
     <TICKET-KEY>   <pkg> needs <version>, main has <version>
     #<pr-number>   <pkg> <version> never applied (<reason from close-list>)
   ```

   If nothing was skipped, say so rather than omitting the section.

### Non-goal

Never remove a dependency to resolve a finding. A transitive dep leaves only when its parent stops depending on it; a direct dep with no published fix needs whatever imported it rewritten, which belongs in a human-authored PR.
