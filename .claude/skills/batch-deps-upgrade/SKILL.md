---
name: batch-deps-upgrade
description: Batch all open Dependabot dependency upgrade PRs into a single PR, plus any further upgrades needed to resolve open Semgrep JIRA tickets that a package upgrade can fix
disable-model-invocation: true
---

Batch all open Dependabot dependency upgrade PRs into a single PR for this repository, **plus any further upgrades needed to resolve the open Semgrep JIRA tickets that a package upgrade can fix**.

**Scope — only tickets about a vulnerable dependency:** ones naming the package, with or without a fix version. Code and configuration findings are out of scope.

Within that scope, the two inputs are independent. Every in-scope ticket gets fixed whether or not a Dependabot PR happens to propose that upgrade. Where no open Dependabot PR covers an impacted package, this PR adds the upgrade itself.

**Two modes — decide which before doing anything else.** The invocation argument arrives as `ARGUMENTS`:

- **empty** (`/batch-deps-upgrade`) — run Steps 1-4, then **stop**. Do not continue into "Closing run" even though it appears further down; this mode writes nothing to JIRA or GitHub, only the working tree and local files.
- **`close`** (`/batch-deps-upgrade close`) — run **only** "Closing run" at the bottom. No discovery, no branch, no install, no tests. Normally used after the batch PR merges.
- **anything else** — stop and ask which was meant. Do not guess.

Requires `gh auth login` and, for the Semgrep parts, the Atlassian MCP.

## Step 1: Discover

Run: gh pr list --repo XRPLF/xrpl.js --label dependencies --state open --limit 500 --json number,title,headRefName,body,url

Parse each PR to extract package names and versions. Dependabot PRs come in two formats:
- **Single-package PRs**: title is `Bump <pkg> from <old> to <new>` — parse from title
- **Grouped PRs** (e.g. #3266, #3051, #3013): title is `bump <pkg1> and <pkg2>` with no versions — parse from PR body, which contains a structured list of package updates with version ranges

Two open PRs can propose the same package (Dependabot opens a new one when a newer release appears before the older PR is closed, and several grouped PRs can each carry the same parent, e.g. `nx`). Treat them as one upgrade to the highest proposed version, but keep a row for each PR.

If any PR can't be parsed from either title or body, flag it for manual review. Build a table of all proposed upgrades. Report the table to the user before proceeding.

Also fetch the Semgrep tickets per **Where the list comes from** under "Semgrep tickets" below, and add them to the same table.

## Step 2: Apply

1. Create a branch from main: deps/batch-deps-upgrade-YYYY-QN (use current year and quarter)
2. Check for **peer dependency conflicts** before upgrading. For each proposed upgrade, run `npm ls <pkg>` and check if any workspace package pins a peer dep that would block the upgrade (e.g., `@xrplf/eslint-config@^3` requires `eslint@^9`, blocking eslint 10). If the blocking package is a **direct** dep we declare and a newer release of it lifts the constraint, it is not a conflict yet: leave the upgrade for item 3, which tries bumping that parent. Mark only the rest as Skipped (peer dep conflict: <details>) and do not attempt them.
3. For each remaining upgrade, determine if it's a direct dep (listed in a package.json) or transitive dep (only in package-lock.json):
   - Direct deps: update the version in the relevant package.json file(s)
   - Transitive deps: run `npm update <pkg> --workspaces --include-workspace-root` to update within semver range. Without `--workspaces`, `npm update` skips packages reached only through a workspace's own deps (e.g. `follow-redirects` and `qs` via `karma` in `packages/xrpl`) and silently leaves them at the old version. If the version still doesn't move, include the parent that pins it in the same command (`npm update body-parser qs --workspaces ...`).
   - Never add `overrides` or widen a parent's declared range to force a resolution — that risks breaking a parent which never declared support for the new version.
   - When an install can't reach its target, find the parent blocking it. If that parent is a **direct** dep we declare, bumping *it* is an ordinary upgrade rather than an override — try that, even across a major, and let Step 3 validate. Nothing else will surface it: a security ticket names the vulnerable package, never the parent pinning it, and Dependabot may have no PR open for it. Observed with `lerna` pinning `tar` and `js-yaml` at exact versions. Mark Skipped only when the blocker is transitive, or when bumping it fails validation.
4. Run `npm install` to update package-lock.json. **Do NOT delete package-lock.json and regenerate from scratch** — this can change hoisted dependency resolution and break builds even when no versions changed.
5. Diff package.json and package-lock.json against main to classify each Dependabot PR **and each Semgrep ticket** as:
   - Upgraded: the resolved version reached at least what the PR or ticket asked for
   - No-op: version was already current or newer
   - A version that moved but stopped short of the target is not Upgraded: find what holds it back (item 3's parent rule) or mark it Skipped with that reason.

   For tickets, see **Picking the target and matching results** under "Semgrep tickets" below — several tickets can share one install, and the match is per ticket.
6. If any upgrade changes the public API of a package (new errors, changed return types, removed functionality) and result in a breaking change, add an entry under `## Unreleased` in that package's `HISTORY.md`.
7. Verify completeness: every PR and every ticket from step 1 must have a status (Upgraded, No-op, or Skipped). If any is unaccounted for, stop and report it before proceeding.

## Step 3: Validate

Read `.github/workflows/nodejs.yml` and `.github/workflows/faucet_test.yml` first — they are the source of truth for which jobs run on which Node versions (`matrix.node-version`) and how long each may take (`timeout-minutes`); re-read them every run, since jobs and versions change. At the time of writing, `lint` and `browser` run on 24.x, `unit` and `integration` on 22.x and 24.x, and `faucet` on 24.x. Run each job on **every** Node version its matrix lists, switching with `nvm use <version>` (install it with `nvm install <version>` if missing) and checking `node --version` before each run — and fail the run if it doesn't match. Any `PATH` change made *after* `nvm use` (e.g. prepending `/opt/homebrew/bin` for `gh`/`docker`) silently puts a system Node back in front. Run `npm ci` after switching so native modules match the interpreter.

Run the full test suite in order:
1. npm run build && npm run lint
2. npm test
3. Start xrpld Docker container (based on CONTRIBUTING.md):
   - Use the image CI uses. It is `rippleci/xrpld:develop` unless `.github/xrpld-image.env` sets `XRPLD_PRIVATE_VERSION`; a private image needs GitLab registry credentials, so if one is configured and you can't pull it, say so and stop rather than test against a different node. Pull it first (`docker pull <image>`) so a stale local copy isn't used.
   - Pre-run cleanup (in case a previous run left a container behind): `docker rm -f xrpld-service 2>/dev/null || true`
   - Start the container: `docker run --detach --rm --publish 6006:6006 --volume "$PWD/.ci-config:/etc/xrpld/" --name xrpld-service <image> --standalone`
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
   - Run: `npm run test:integration` on each Node version in turn (never in parallel — every test funds wallets from the same genesis account and closes ledgers with `ledger_accept`, so parallel runs against one node collide), then `npm run test:browser`
   - Stop container: `docker stop xrpld-service` (auto-removed via `--rm`)
4. npm run test:faucet — one run at a time; it hits the public faucets, which rate-limit. CI runs `faucet_test.yml` only on pushes to `main`, never on the PR, so this local run is the only faucet check the batch gets before merge.

- **Bound every run.** Give each job the same limit CI does (`timeout-minutes` in the workflow) and treat hitting it as a failure: kill it, record it, and restart xrpld before the next run. macOS has no `timeout(1)`; use `gtimeout` from coreutils or a small `perl -e 'alarm ...'` wrapper.
- **Check the test count, not only the verdict.** A suite whose setup fails can drop its tests silently. Compare the `Tests:` totals across Node versions and against `main`; a lower count is a failure even when the remaining tests pass.
- **Clean up on any exit.** If you stop part-way, stop the xrpld container and any processes you started, so nothing keeps running unattended.

If a test fails in a way that looks unrelated to the upgrade (a timeout, a different test failing on each run), run the same command on `main` in a separate worktree before blaming the batch. Report it as pre-existing only when `main` fails the same way, and give both pass rates in the PR description; one passing run on either side proves nothing.

If any step fails, **attempt to fix the breaking change with code modifications before rolling back**. Common patterns:

- **BigNumber.js major bumps**: v10+ throws on invalid input instead of returning NaN. Wrap `new BigNumber(val)` calls in try-catch where the code previously checked for NaN.
- **ESM-only packages** (e.g., https-proxy-agent): Add transform entries and `transformIgnorePatterns` exclusions in `jest.config.base.js` so Jest can parse ESM imports.
- **Type compatibility** (e.g., @scure/base 2.0 changing Uint8Array generics): Widen variable type annotations (e.g., `let buf: Uint8Array = ...` instead of `let buf = ...`).
- **New lint findings from a linter/plugin bump** (e.g., typescript-eslint 8.59+ `no-unnecessary-type-assertion` reporting casts by assignability): `eslint --fix` is usually right, but run `tsc --noEmit` afterwards and review the diff — a removed cast can be a narrowing the rule misjudges (the `Flags` casts in `NFTokenCreateOffer`/`MPTokenIssuanceCreate`). Replace such a cast with an annotated declaration (`const flags: number | XFlagsInterface = tx.Flags ?? 0`) rather than a long disable comment, and delete imports the fix left unused. Never auto-fix in one pass across the repo without reading the result.
- **Type resolution leaning on a hoisted copy** (e.g., https-proxy-agent): with `moduleResolution: "node"`, TypeScript ignores `exports`, so an exports-only package only type-checks if some *other* copy with a `types` field is hoisted to the root. When a bump removes that copy (2026-Q4: nx/axios stopped pulling https-proxy-agent@7, so xrpl's v9 hoisted) tests fail with `TS2307: Cannot find module`. Run `tsc --traceResolution` on `main` and the branch to see which copy each one used; the fix applied was `module: "node20"`, `moduleResolution: "node16"` in the ts-jest `tsconfig` of `jest.config.base.js`.
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
   - Include a "Superseded Dependabot PRs" section with a table: PR (linked), Package, From, Asked for, Resolved, Status, MajorVersionUpgrade. The **Semgrep tickets** table uses these same columns, with the first headed `Ticket` — one shape for both artifacts.
     - `From` is the version on `main`; `Asked for` is what the PR proposed or the ticket requires (`≥ x.y.z`, taken from the advisory when the ticket gives none — one per vulnerable major line; for such a ticket with no upgrade target, the advisory's affected range when it is No-op or has no fixed release, or `unknown` when the advisory gives no usable range); `Resolved` is what the lockfile actually holds after the batch. Keep them in separate columns: the three routinely differ (a PR proposing 22.7.8 can resolve to 23.2.0), and burying the real version in Status prose makes the table unverifiable.
     - Status values: Upgraded, No-op (reason), Skipped (peer dep conflict / CI failure: error) — a status and its reason, never a version number.
     - MajorVersionUpgrade: `No` if the major version number did not change. Otherwise `Yes` plus a link for each major version crossed. For example, 7.x → 9.x yields `Yes ([v8](url), [v9](url))`. Each link should point to the package's release notes or changelog for that major version. Verify each link returns HTTP 200 and has meaningful content (e.g., `curl -sL --max-time 20 -o /dev/null -w "%{http_code}" <url>` — always set a timeout; an unbounded `curl` to GitHub can hang indefinitely); if a package doesn't publish per-version GitHub releases (e.g., TypeScript sometimes skips `x.0.0`/`x.0.1` tags, bignumber.js puts details in CHANGELOG.md), fall back to the CHANGELOG.md file or the closest valid release tag.
   - For every **major version upgrade**, add a "Major version upgrade notes" section below the table. For each major-version package, include a link to the release notes, a brief summary of key changes (breaking changes, deprecations, new features), and either why no code changes were required or a summary of the code changes that were made — so reviewers can judge the impact without reading the full release notes.
   - Closing instructions with two paragraphs:
     1. "After merging, run `/batch-deps-upgrade close` to close the superseded PRs and the resolved Semgrep tickets." Follow it with the list of Upgraded and No-op PRs (#X, #Y, #Z) as a record, so the PR documents what will be closed even if the skill isn't used.
     2. "The following PRs were Skipped and should remain open: #A (package-a), #B (package-b), ..." — annotate each with the package name. These stay open so Dependabot keeps rebasing them.
   - Include a **"Semgrep tickets"** table with the same columns, the first headed `Ticket`. Status alone cannot be verified against `main`, so `Asked for` and `Resolved` must be their own columns. Because `close-list.md` is not committed, this table is the closing run's fallback.
   - Give ticket-driven upgrades that no Dependabot PR proposed their own table naming the motivating ticket — they are additions, not supersessions.
   - Call out separately, in the overview, any **major** bump taken to unblock a ticket: no PR or ticket asked for it, so a reviewer will not be expecting it and must see it flagged rather than buried in a table.
   - List notable incidental lockfile changes (transitive packages added, removed or moved across a major by a bump), each with the bump that pulled it in.
   - For "Test Plan", give each Step 3 job's result per Node version, including the local-only faucet run and the test counts, plus any failure reported as pre-existing with the `main` comparison behind it.

4. **Close list** — write a markdown file (`.claude/skills/batch-deps-upgrade/close-list.md`) recording every ticket and Dependabot PR the batch makes closable. This is the input to the closing run.

   1. **Close** — every Upgraded and No-op ticket and PR, in one shape for both so a single parser handles them:

      ```
      <ticket-key or #pr> | <package> | installed <resolved> (<asked for>) | Comment: "<text>"
      ```

      The third field must carry the **resolved** version, not the proposed one — that is what step 1 of the closing run checks against `main`, and a proposed version cannot be verified.

      A ticket whose fix version came from its advisory, Upgraded or No-op, carries the advisory's affected range instead, so the closing run checks every installed line — and `not installed` when the package is gone: `installed 3.0.3 (outside < 3.0.3)`, `installed 5.7.2, 6.3.1 (outside < 5.7.2, 6.0.0–<6.3.1)`, `not installed (≤ 2.88.2)`.

      Every comment must reference the batch PR, which does not exist yet at this point. Write that reference as the literal token `<PR>`; the closing run substitutes the merged PR's URL. Use a URL rather than `#1234`, which JIRA renders as plain text.
   2. **Left open** — every Skipped one, with its reason, keyed like a Close row so the closing run can match them: `<ticket-key or #pr> | <package> | <reason>`. Each is a security fix that did not land, so this is worth reading. Skipped PRs stay open for Dependabot to keep rebasing — including a grouped PR where only some of its packages were Skipped, so such a PR goes here and not under Close.

   **Do NOT commit `close-list.md`** — local scratch, like `code-changes.md` and `pr-description.md`. That is why the PR body must carry the same lists (item 3): it is the closing run's fallback when this file is gone.


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

`textfields ~ "xrpl.js"` is a text search, so it can also return tickets for other repositories that mention xrpl.js. Keep only tickets whose summary or vulnerable-code link names `XRPLF/xrpl.js`.

**Take the package name from the summary, not the description** — a description may list several packages sharing one advisory (e.g. DGE-8019), so it picks the wrong one. Take the fix version, severity and CVE/GHSA link from the description; if it gives no fix version, see the next paragraph. Wording varies, so read for intent rather than matching labels literally.

Keep every ticket that names a vulnerable package. Drop tickets that name no vulnerable package, such as code and configuration findings. A package ticket with no fix version is still a row: take the fix version from its advisory (the GHSA link; read it with `gh api /advisories/<GHSA-id> --jq '.vulnerabilities[] | select(.package.ecosystem == "npm") | {package: .package.name, range: .vulnerable_version_range, patched: .first_patched_version}'` — keep only the `npm` entries for the ticket's package, since one advisory can cover the same name in several ecosystems) instead — for each installed major line inside the affected range, the first patched version on that line, or on a higher major if that line has none — and handle it like any other ticket. It is satisfied only when every installed version falls outside the advisory's affected range: No-op if that was already true on `main` or the package is no longer installed, Upgraded if the batch made it true. Mark it Skipped only when the advisory has no patched version at all ("no fixed release exists") or has no usable range ("flag for manual review") — both need a human decision. If tickets came back but none of them could be parsed, that is a parsing failure — stop. If the query returned nothing, or nothing was in scope, there is simply no Semgrep work this quarter: record zero and carry on with the Dependabot batch. A ticket becomes a row whether or not a Dependabot PR proposes that package; a ticket is reason enough on its own.

### Picking the target and matching results (Step 2)

Where a ticket and a PR both want the same install, the target is the **highest** version either wants. Matching rules — get them wrong and you close tickets whose vulnerability is still installed:

- Compare with semver, never as strings — lexically `"7.5.9" > "7.5.21"`.
- Check the install the ticket means. One package can resolve at several versions at once (`brace-expansion`), so "any install ≥ target" can answer yes off an unrelated major line. Match the install on the ticket's own major line. If that line is gone because the package moved to a **higher** major, the ticket is satisfied — the vulnerable line is no longer installed — provided the advisory's affected range does not extend into the new major.
- Match per ticket, not per package. Tickets sharing one install can want different versions (`tar`). Never conclude "we upgraded X, so close the X tickets".
- Check the advisory too, even when the ticket gives a fix version. Reaching the ticket's version on its major line is necessary but not enough: every installed version must also fall outside every `npm` range the ticket's advisory lists for that package (`brace-expansion` resolves on the 1.x, 2.x and 5.x lines at once, and the advisory covers all three). If one doesn't, the ticket isn't satisfied — take the advisory's patched version on that line as an extra target.
- When the ticket's fix version sits on a different major than the install it was filed against (DGE-5838: `diff` 4.0.2 installed, "fix" 8.0.3), Semgrep is usually naming the newest patched release, not the only one. If the advisory lists a patched version on the installed line, that is the target; if `main` already has it, the ticket is No-op. Say so in the PR so a reviewer can object.
- A ticket whose package is no longer in `package-lock.json` after the batch is satisfied, fix version or not (it is No-op if it was already absent on `main`). Record it with the `not installed (<asked for>)` third field.

Classify from the Step 2.5 diff, not from which PR did what: a parent bump carries along a dependency it pins exactly, so a ticket can come out Upgraded with no PR naming its package (`nx` pins `axios`).

Write `close-list.md` — the closing run's input, so keep it parseable, one item per line.

### Non-goal

Never remove a dependency to resolve a finding. A transitive dep leaves only when its parent stops depending on it; a direct dep with no published fix needs whatever imported it rewritten, which belongs in a human-authored PR.

## Closing run (`/batch-deps-upgrade close`)

> **Runs only when `ARGUMENTS` is `close`.** If you reached this section by reading past Step 4 during a default run, stop here — everything below comments on and closes real JIRA tickets and real public PRs.

Runs none of Steps 1-4: no ticket discovery, no bumps, and none of Step 3's build/test chain. That exclusion does **not** cover the per-item check in step 1 below — that one always runs, and it is the safeguard against closing something whose fix was reverted. Read section 1 of `close-list.md`; if it is missing, fall back to the merged PR body's lists. Identify the batch PR from an argument or `gh pr list --repo XRPLF/xrpl.js --state merged --head <branch>`, and replace the `<PR>` token in every comment with its URL. **Check that no comment still contains `<PR>` before posting anything** — if one does, the substitution failed, so stop rather than post a placeholder onto dozens of tickets.

1. **Verify each item against the current `main`** and skip anything not genuinely satisfied — a reviewer may have had an upgrade reverted. This is what makes the run safe whether or not the batch has merged. For each item, compare the version `main` locks with the item's asked-for version using semver ordering: it must be at or above it. For a range-based item, verify that every installed version on `main` is still outside the range. A `not installed` item — range-based or not — passes only if the package is still absent. Close each PR at most once, and never close a PR that also has a Left open row.
2. **Close everything that verified.** Do not ask for approval; the engineer reviewed both lists on the PR, and step 1 is the real check.
   - **JIRA tickets** — complete the `Done` transition first (query available transitions, take the one to `Done`), then post the comment. This avoids open-but-commented tickets if transition fails.
   - **Dependabot PRs** — `gh pr close <n> --repo XRPLF/xrpl.js --comment "<comment>"`.
3. Report in this shape:

   ```
   Closed <n> JIRA tickets, <n> Dependabot PRs.

   Skipped — not satisfied on main @ <sha> (<n>):
     <TICKET-KEY>   <pkg> needs <version>, main has <version>
     #<pr-number>   <pkg> <version> never applied (<reason from close-list>)
   ```

   If nothing was skipped, say so rather than omitting the section.
