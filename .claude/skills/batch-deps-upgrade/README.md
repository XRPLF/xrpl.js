# Batch Dependency Upgrade

Batches all open Dependabot PRs into a single upgrade PR, plus any further upgrades needed to resolve the open Semgrep JIRA tickets that a package upgrade can fix.

Only Semgrep JIRA tickets fixable by a package upgrade are in scope — the ones naming a vulnerable dependency and a recommended fix version.

The two inputs are independent: every in-scope ticket gets fixed whether or not a Dependabot PR proposes that upgrade — where none does, the batch PR adds it.

## The two commands

Run at different times:

| Command | When | What it touches |
| --- | --- | --- |
| `/batch-deps-upgrade` | building the batch | working tree and local files only |
| `/batch-deps-upgrade close` | after the batch upgrade PR is merged | JIRA tickets and Dependabot PRs |

## Prerequisites

- `gh auth login` -- needed to list open Dependabot PRs
- Docker daemon running -- the skill starts a rippled container for integration/browser tests
- Atlassian MCP available -- needed to read the Semgrep tickets and later comment on and close them

## `/batch-deps-upgrade` — build the batch

From the xrpl.js repo root, start a new Claude Code session and run:

```
/batch-deps-upgrade
```

It discovers the open Dependabot PRs and Semgrep tickets, applies the upgrades, runs the full test suite, and writes `code-changes.md`, `pr-description.md` and `close-list.md` plus a commit message. It creates the branch but does not commit, and writes nothing outside the repo.

Then, by hand:

1. Review the changes and generated files. Ask Claude questions about specific changes if they don't make sense — the code changes may need multiple rounds of discussion and correction before they're ready.
2. Stage and commit using the suggested commit message. Do **not** commit the generated markdown files, `close-list.md` included — they're local scratch.
3. Push and open a PR using the generated PR description. Its "Semgrep tickets" and "Superseded Dependabot PRs" sections are the durable record of what gets closed later.
4. Get the PR reviewed and merged.

## `/batch-deps-upgrade close` — close what the batch superseded

Once the batch upgrade PR is merged, run this from the same working tree if you still have it — it reads `close-list.md`, falling back to the merged PR body if that file is gone:

```
/batch-deps-upgrade close
```

It re-verifies every item against `main` before acting, then comments on and closes the resolved Semgrep tickets and the superseded Dependabot PRs, and reports anything it skipped. Skipped Dependabot PRs are left open so Dependabot keeps rebasing them.

Afterwards, read the "Left open" section of `close-list.md` — each entry is a security fix that didn't land, with its reason. Expect one of: the package holding it back is already at its own latest version, so there is no upgrade left to take and it needs replacing instead; the blocker is a transitive dependency we don't declare; or the unblocking bump failed validation and was rolled back. All three need a human-authored PR.
