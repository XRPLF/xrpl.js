const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const UPSTREAM_REPO = 'XRPLF/rippled'
const ARTIFACT_NAME = 'server-definitions'

function usage() {
  console.log(
    `Usage: node ${path.basename(process.argv[1])} [options] [output_path]

Downloads server_definitions.json from rippled CI artifacts and saves it as definitions.json.

Requires the GitHub CLI (gh) to be installed and authenticated.
  https://cli.github.com/

Options:
  --branch <name>   Branch name (default: develop)
                    Use "owner:branch" for fork branches (e.g. "contributor:my-feature")
  --pr <number>     Pull request number
  -h, --help        Show this help message

Examples:
  node ${path.basename(process.argv[1])}
  node ${path.basename(process.argv[1])} --branch develop
  node ${path.basename(process.argv[1])} --pr 6858
  node ${path.basename(process.argv[1])} --branch contributor:ct-extensive-tests-clean
  node ${path.basename(process.argv[1])} --branch feature-branch ./custom-output.json`,
  )
  process.exit(0)
}

function parseArgs() {
  const args = process.argv.slice(2)
  let branch = 'develop'
  let prNumber = null
  let outputFile = path.join(__dirname, '../src/enums/definitions.json')

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--branch':
        branch = args[++i]
        if (!branch) {
          console.error('Error: --branch requires a branch name')
          process.exit(1)
        }
        break
      case '--pr':
        prNumber = args[++i]
        if (!prNumber) {
          console.error('Error: --pr requires a pull request number')
          process.exit(1)
        }
        break
      case '-h':
      case '--help':
        usage()
        break
      default:
        outputFile = args[i]
    }
  }

  // Parse "owner:branch" format for fork branches
  let forkOwner = null
  if (!prNumber && branch.includes(':')) {
    const colonIndex = branch.indexOf(':')
    forkOwner = branch.substring(0, colonIndex)
    branch = branch.substring(colonIndex + 1)
  }

  return { branch, forkOwner, prNumber, outputFile }
}

function exec(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim()
}

function checkGhCli() {
  try {
    execSync('gh --version', { stdio: 'ignore' })
  } catch {
    console.error(
      'Error: GitHub CLI (gh) is required but not found.\n' +
        'Install from https://cli.github.com/',
    )
    process.exit(1)
  }
}

function getPRInfo(prNumber) {
  try {
    return JSON.parse(
      exec(
        `gh api "repos/${UPSTREAM_REPO}/pulls/${prNumber}" --jq '{headRefName: .head.ref, headRefOid: .head.sha}'`,
      ),
    )
  } catch {
    console.error(`Error: Could not find PR #${prNumber} in ${UPSTREAM_REPO}`)
    process.exit(1)
  }
}

function findPRForForkBranch(forkOwner, branch) {
  try {
    const result = exec(
      `gh api "repos/${UPSTREAM_REPO}/pulls?head=${forkOwner}:${encodeURIComponent(branch)}&state=all&per_page=1" --jq '.[0] | {number, headRefOid: .head.sha}'`,
    )
    if (result && result !== 'null') {
      return JSON.parse(result)
    }
  } catch {
    // No PR found
  }
  return null
}

function findRunWithArtifactBySha(repo, sha) {
  try {
    const runId = exec(
      `gh api "repos/${repo}/actions/artifacts?name=${ARTIFACT_NAME}&per_page=50" --jq '[.artifacts[] | select(.expired == false and .workflow_run.head_sha == "${sha}")] | .[0].workflow_run.id'`,
    )
    if (runId && runId !== 'null') return runId
  } catch {
    // No artifact found
  }
  return null
}

function findRunWithArtifactByBranch(repo, branch) {
  try {
    const runId = exec(
      `gh api "repos/${repo}/actions/artifacts?name=${ARTIFACT_NAME}&per_page=50" --jq '[.artifacts[] | select(.expired == false and .workflow_run.head_branch == "${branch}")] | .[0].workflow_run.id'`,
    )
    if (runId && runId !== 'null') return runId
  } catch {
    // No artifact found
  }
  return null
}

function downloadArtifact(repo, runId, outputFile) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-definitions-'))

  try {
    exec(
      `gh run download ${runId} --repo ${repo} --name ${ARTIFACT_NAME} --dir "${tmpDir}"`,
    )

    const serverDefsPath = path.join(tmpDir, 'server_definitions.json')
    if (!fs.existsSync(serverDefsPath)) {
      console.error(
        'Error: server_definitions.json not found in downloaded artifact',
      )
      process.exit(1)
    }

    const serverDefs = JSON.parse(fs.readFileSync(serverDefsPath, 'utf-8'))
    fs.writeFileSync(
      outputFile,
      JSON.stringify(serverDefs, null, 2) + '\n',
      'utf-8',
    )
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

function main() {
  checkGhCli()

  const { branch, forkOwner, prNumber, outputFile } = parseArgs()

  let runId
  let repo = UPSTREAM_REPO

  if (prNumber) {
    const prInfo = getPRInfo(prNumber)
    console.log(
      `Resolved PR #${prNumber} to branch "${prInfo.headRefName}" (${prInfo.headRefOid.substring(0, 7)})`,
    )

    // Try commit SHA first — this works for fork PRs where the branch name
    // belongs to the fork repo and won't be found by branch-based search.
    console.log('Searching by commit SHA...')
    runId = findRunWithArtifactBySha(UPSTREAM_REPO, prInfo.headRefOid)

    if (!runId) {
      console.log(
        `No artifact found by SHA, trying branch "${prInfo.headRefName}"...`,
      )
      runId = findRunWithArtifactByBranch(UPSTREAM_REPO, prInfo.headRefName)
    }
  } else if (forkOwner) {
    const forkRepo = `${forkOwner}/rippled`
    console.log(`Fork branch detected: "${forkOwner}:${branch}"`)

    // Check if there's a PR in the upstream repo for this fork branch
    console.log(`Checking for PR in ${UPSTREAM_REPO}...`)
    const pr = findPRForForkBranch(forkOwner, branch)

    if (pr) {
      console.log(
        `Found PR #${pr.number} (${pr.headRefOid.substring(0, 7)}), searching upstream CI...`,
      )
      runId = findRunWithArtifactBySha(UPSTREAM_REPO, pr.headRefOid)

      if (!runId) {
        runId = findRunWithArtifactByBranch(UPSTREAM_REPO, branch)
      }
    }

    if (!runId) {
      // No PR or no artifact in upstream — search the fork repo's CI
      console.log(
        `Searching fork repo ${forkRepo} for CI on branch "${branch}"...`,
      )
      repo = forkRepo
      runId = findRunWithArtifactByBranch(forkRepo, branch)
    }
  } else {
    console.log(
      `Searching for "${ARTIFACT_NAME}" artifact on branch "${branch}"...`,
    )
    runId = findRunWithArtifactByBranch(UPSTREAM_REPO, branch)
  }

  if (!runId) {
    console.error(
      `Error: No CI runs with "${ARTIFACT_NAME}" artifact found.\n` +
        'Make sure the branch has a successful CI run that produced the server-definitions artifact.',
    )
    process.exit(1)
  }

  console.log(`Found artifact in run ${runId}`)

  console.log('Downloading artifact...')
  downloadArtifact(repo, runId, outputFile)
  console.log(`Definitions written to ${outputFile}`)
}

main()
