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

It will:

1. Discover all open Dependabot PRs via `gh pr list`, and the open Semgrep tickets via JIRA, keeping the ones a package upgrade can fix
2. Apply the Dependabot upgrades **and every upgrade an in-scope Semgrep ticket needs**, then run `npm install`
3. Validate with build, lint, unit tests, integration tests, browser tests and faucet tests
4. Generate output files and a commit message for you to use, including `close-list.md` — the JIRA tickets and Dependabot PRs that become closable once the PR merges

This command **writes nothing to JIRA or GitHub**. It changes the working tree and writes local files, so an abandoned run leaves no trace outside the repo.

Then, by hand:

1. Review the changes and generated files. Ask Claude questions about specific changes if they don't make sense — the code changes may need multiple rounds of discussion and correction before they're ready.
2. Stage and commit using the suggested commit message (the skill already creates a branch). Do **not** commit the generated markdown files, `close-list.md` included — they're local scratch.
3. Push and open a PR using the generated PR description. Its "Semgrep tickets" and "Superseded Dependabot PRs" sections are the durable record of what gets closed later.
4. Get the PR reviewed and merged.

## `/batch-deps-upgrade close` — close what the batch superseded

Once the batch upgrade PR is merged, run this from the same working tree if you still have it:

```
/batch-deps-upgrade close
```

It will:

1. Read `close-list.md` — or fall back to the merged PR body if that file is gone
2. Re-verify every item against `main`, skipping anything that review dropped from the PR
3. Comment on and close the resolved Semgrep tickets, and close the superseded Dependabot PRs, each citing the batch PR
4. Report the counts, plus any item it skipped and why

It does not stop to ask for approval. You reviewed both lists as part of the batch PR, and step 2 re-checks them against `main` — that verification is the real safeguard, not a prompt listing dozens of IDs nobody can audit.

Skipped Dependabot PRs are left open so Dependabot keeps rebasing them.

Afterwards, read the "Left open" section of `close-list.md`. Each entry is a security fix that didn't land — usually because a parent package pins the vulnerable version — and may warrant a manual fix outside the skill.
