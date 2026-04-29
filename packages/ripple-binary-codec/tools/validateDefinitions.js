const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const UPSTREAM_REPO = 'XRPLF/rippled'
const ARTIFACT_NAME = 'server-definitions'
const DEFINITIONS_PATH = path.join(__dirname, '../src/enums/definitions.json')

// Required top-level keys that the binary codec depends on
const REQUIRED_KEYS = [
  'FIELDS',
  'LEDGER_ENTRY_TYPES',
  'TRANSACTION_RESULTS',
  'TRANSACTION_TYPES',
  'TYPES',
]

// ─── gh CLI helpers ──────────────────────────────────────────────────────────

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

function downloadBenchmark() {
  console.log(
    'Downloading benchmark definitions from rippled develop branch...',
  )
  const runId = findRunWithArtifactByBranch(UPSTREAM_REPO, 'develop')
  if (!runId) {
    console.error(
      'Error: Could not find server-definitions artifact on rippled develop branch.',
    )
    process.exit(1)
  }

  console.log(`Found artifact in run ${runId}`)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-definitions-'))

  try {
    exec(
      `gh run download ${runId} --repo ${UPSTREAM_REPO} --name ${ARTIFACT_NAME} --dir "${tmpDir}"`,
    )
    const serverDefsPath = path.join(tmpDir, 'server_definitions.json')
    if (!fs.existsSync(serverDefsPath)) {
      console.error(
        'Error: server_definitions.json not found in downloaded artifact',
      )
      process.exit(1)
    }
    return JSON.parse(fs.readFileSync(serverDefsPath, 'utf-8'))
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ─── Structure classification ────────────────────────────────────────────────

// Inspect a benchmark value to determine its category for validation/comparison.
// Returns: 'fields' | 'simpleMap' | 'nestedMap' | 'formatArray' | 'skip'
function classifyValue(value) {
  // FIELDS: array of [string, object] pairs
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      Array.isArray(value[0]) &&
      value[0].length === 2 &&
      typeof value[0][0] === 'string' &&
      typeof value[0][1] === 'object'
    ) {
      return 'fields'
    }
    return 'skip'
  }

  if (typeof value !== 'object' || value === null) {
    return 'skip'
  }

  const firstValue = Object.values(value)[0]
  if (firstValue === undefined) return 'skip'

  // Simple map: { string: number }
  if (typeof firstValue === 'number') {
    return 'simpleMap'
  }

  // Nested map (flags): { string: { string: number } }
  if (typeof firstValue === 'object' && !Array.isArray(firstValue)) {
    const innerFirst = Object.values(firstValue)[0]
    if (typeof innerFirst === 'number') {
      return 'nestedMap'
    }
  }

  // Format array: { string: [{ name, optionality }] }
  if (Array.isArray(firstValue)) {
    if (
      firstValue.length > 0 &&
      typeof firstValue[0] === 'object' &&
      'name' in firstValue[0] &&
      'optionality' in firstValue[0]
    ) {
      return 'formatArray'
    }
  }

  return 'skip'
}

// ─── Structural validation ───────────────────────────────────────────────────

function validateStructure(local, benchmark) {
  const errors = []

  // Check required keys
  for (const key of REQUIRED_KEYS) {
    if (!(key in local)) {
      errors.push(`Missing required key: "${key}"`)
    }
  }

  // Validate each key in the local file based on the benchmark's structure
  for (const [key, localValue] of Object.entries(local)) {
    const category = benchmark[key] !== undefined
      ? classifyValue(benchmark[key])
      : classifyValue(localValue)

    switch (category) {
      case 'fields':
        if (!Array.isArray(localValue)) {
          errors.push(`${key} must be an array`)
          break
        }
        localValue.forEach((entry, i) => {
          if (!Array.isArray(entry) || entry.length !== 2) {
            errors.push(`${key}[${i}]: expected [name, info] pair`)
            return
          }
          const [name, info] = entry
          if (typeof name !== 'string') {
            errors.push(`${key}[${i}]: name must be a string, got ${typeof name}`)
          }
          if (typeof info !== 'object' || info === null) {
            errors.push(`${key}[${i}] ("${name}"): info must be an object`)
            return
          }
          for (const prop of ['isSerialized', 'isSigningField', 'isVLEncoded']) {
            if (typeof info[prop] !== 'boolean') {
              errors.push(
                `${key} "${name}": "${prop}" must be a boolean, got ${typeof info[prop]}`,
              )
            }
          }
          if (typeof info.nth !== 'number') {
            errors.push(
              `${key} "${name}": "nth" must be a number, got ${typeof info.nth}`,
            )
          }
          if (typeof info.type !== 'string') {
            errors.push(
              `${key} "${name}": "type" must be a string, got ${typeof info.type}`,
            )
          }
        })
        break

      case 'simpleMap':
        if (typeof localValue !== 'object' || Array.isArray(localValue)) {
          errors.push(`${key} must be an object`)
          break
        }
        for (const [name, value] of Object.entries(localValue)) {
          if (typeof value !== 'number') {
            errors.push(
              `${key} "${name}": value must be a number, got ${typeof value}`,
            )
          }
        }
        break

      case 'nestedMap':
        if (typeof localValue !== 'object' || Array.isArray(localValue)) {
          errors.push(`${key} must be an object`)
          break
        }
        for (const [typeName, flags] of Object.entries(localValue)) {
          if (typeof flags !== 'object' || Array.isArray(flags)) {
            errors.push(`${key} "${typeName}": value must be an object`)
            continue
          }
          for (const [flagName, value] of Object.entries(flags)) {
            if (typeof value !== 'number') {
              errors.push(
                `${key} "${typeName}"."${flagName}": value must be a number, got ${typeof value}`,
              )
            }
          }
        }
        break

      case 'formatArray':
        if (typeof localValue !== 'object' || Array.isArray(localValue)) {
          errors.push(`${key} must be an object`)
          break
        }
        for (const [typeName, fields] of Object.entries(localValue)) {
          if (!Array.isArray(fields)) {
            errors.push(`${key} "${typeName}": value must be an array`)
            continue
          }
          fields.forEach((field, i) => {
            if (typeof field.name !== 'string') {
              errors.push(`${key} "${typeName}"[${i}]: "name" must be a string`)
            }
            if (typeof field.optionality !== 'number') {
              errors.push(
                `${key} "${typeName}"[${i}]: "optionality" must be a number`,
              )
            }
          })
        }
        break
    }
  }

  return errors
}

// ─── Entry comparison ────────────────────────────────────────────────────────

function compareDefinitions(local, benchmark) {
  const errors = []

  for (const [key, benchValue] of Object.entries(benchmark)) {
    if (!(key in local)) continue // Missing key in local is ok

    const category = classifyValue(benchValue)
    const localValue = local[key]

    switch (category) {
      case 'fields': {
        // Use first occurrence of each name (server_definitions may have duplicates)
        const benchMap = new Map()
        for (const [name, info] of benchValue) {
          if (!benchMap.has(name)) {
            benchMap.set(name, info)
          }
        }
        for (const [name, localInfo] of localValue) {
          const benchInfo = benchMap.get(name)
          if (!benchInfo) continue // Extra entry in local, ok
          for (const prop of Object.keys(benchInfo)) {
            if (localInfo[prop] !== benchInfo[prop]) {
              errors.push(
                `${key} "${name}".${prop}: expected ${JSON.stringify(benchInfo[prop])}, got ${JSON.stringify(localInfo[prop])}`,
              )
            }
          }
        }
        break
      }

      case 'simpleMap':
        for (const [name, localVal] of Object.entries(localValue)) {
          if (!(name in benchValue)) continue
          if (localVal !== benchValue[name]) {
            errors.push(
              `${key} "${name}": expected ${benchValue[name]}, got ${localVal}`,
            )
          }
        }
        break

      case 'nestedMap':
        for (const [typeName, localFlags] of Object.entries(localValue)) {
          if (!(typeName in benchValue)) continue
          const benchFlags = benchValue[typeName]
          for (const [flagName, localVal] of Object.entries(localFlags)) {
            if (!(flagName in benchFlags)) continue
            if (localVal !== benchFlags[flagName]) {
              errors.push(
                `${key} "${typeName}"."${flagName}": expected ${benchFlags[flagName]}, got ${localVal}`,
              )
            }
          }
        }
        break

      case 'formatArray':
        for (const [typeName, localFields] of Object.entries(localValue)) {
          if (!(typeName in benchValue)) continue
          const benchFields = new Map(
            benchValue[typeName].map((f) => [f.name, f]),
          )
          for (const localField of localFields) {
            const benchField = benchFields.get(localField.name)
            if (!benchField) continue
            for (const prop of Object.keys(benchField)) {
              if (localField[prop] !== benchField[prop]) {
                errors.push(
                  `${key} "${typeName}" field "${localField.name}".${prop}: expected ${benchField[prop]}, got ${localField[prop]}`,
                )
              }
            }
          }
        }
        break
    }
  }

  return errors
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  checkGhCli()

  // 1. Read local definitions.json
  console.log(`Reading ${DEFINITIONS_PATH}...`)
  let local
  try {
    local = JSON.parse(fs.readFileSync(DEFINITIONS_PATH, 'utf-8'))
  } catch (e) {
    console.error(`Error: Failed to parse definitions.json: ${e.message}`)
    process.exit(1)
  }

  // 2. Download benchmark from rippled develop
  const benchmark = downloadBenchmark()

  // 3. Structural validation (uses benchmark to classify keys)
  console.log('Validating structure...')
  const structErrors = validateStructure(local, benchmark)
  if (structErrors.length > 0) {
    console.error('\nStructural validation errors:')
    structErrors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }
  console.log('Structure OK')

  // 4. Compare entries
  console.log('Comparing entries against benchmark...')
  const compareErrors = compareDefinitions(local, benchmark)
  if (compareErrors.length > 0) {
    console.error(`\n${compareErrors.length} entry mismatch(es) found:`)
    compareErrors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }

  console.log('All entries match the benchmark. Validation passed.')
}

main()
