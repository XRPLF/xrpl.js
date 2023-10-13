/* eslint-disable no-continue -- unneeded here */
/**
 * This file writes the `validate` function for a transaction, when provided the model name in the `src/models/transactions`
 * folder.
 */
const fs = require('fs')

const NORMAL_TYPES = ['number', 'string']
const NUMBERS = ['0', '1']

// TODO: rewrite this to use regex

async function main() {
  if (process.argv.length < 3) {
    console.log(`Usage: ${process.argv[0]} ${process.argv[1]} TxName`)
    process.exit(1)
  }
  const modelName = process.argv[2]
  const filename = `./src/models/transactions/${modelName}.ts`
  const [model, txName] = await getModel(filename)
  return processModel(model, txName)
}

async function getModel(filename) {
  let model = ''
  let started = false
  let ended = false
  const data = await fs.promises.readFile(filename, { encoding: 'utf8' })
  const lines = data.split('\n')
  for (const line of lines) {
    if (ended) {
      continue
    }
    if (!started && !line.startsWith('export')) {
      continue
    }
    if (!started && line.includes('Flags')) {
      continue
    }
    if (!started) {
      started = true
    }
    model += `${line}\n`
    if (line === '}') {
      ended = true
    }
  }
  const name_line = model.split('\n')[0].split(' ')
  const txName = name_line[2]
  return [model, txName]
}

function getValidationFunction(paramType) {
  if (NORMAL_TYPES.includes(paramType)) {
    const paramTypeCapitalized =
      paramType.substring(0, 1).toUpperCase() + paramType.substring(1)
    return `is${paramTypeCapitalized}(inp)`
  }
  if (NUMBERS.includes(paramType)) {
    return `inp === ${paramType}`
  }
  return `is${paramType}(inp)`
}

function getValidationLine(validationFns) {
  if (validationFns.length === 1) {
    if (!validationFns[0].includes('===')) {
      // Example: `validateRequiredFields(tx, 'Amount', isAmount)`
      const validationFn = validationFns[0]
      // strip the `(inp)` in e.g. `isAmount(inp)`
      return validationFn.substring(0, validationFn.length - 5)
    }
  }
  // Example:
  // `validateRequiredFields(tx, 'XChainAccountCreateCount',
  //    (inp) => isNumber(inp) || isString(inp)))`
  return `(inp) => ${validationFns.join(' || ')}`
}

function processModel(model, txName) {
  let output = ''
  // process the TS model and get the types of each parameter
  for (let line of model.split('\n')) {
    if (line === '') {
      continue
    }
    if (line.startsWith('export')) {
      continue
    }
    if (line === '}') {
      continue
    }
    line = line.trim()
    if (line.startsWith('TransactionType')) {
      continue
    }
    if (line.startsWith('Flags')) {
      continue
    }
    if (line.startsWith('/**')) {
      continue
    }
    if (line.startsWith('*')) {
      continue
    }

    // process the line with a type
    const split = line.split(' ')
    const param = split[0].replace('?:', '').replace(':', '').trim()
    const paramTypes = split.slice(1)
    const optional = split[0].endsWith('?:')
    const functionName = optional
      ? 'validateOptionalField'
      : 'validateRequiredField'

    // process the types and turn them into a validation function
    let idx = 0
    const if_outputs = []
    while (idx < paramTypes.length) {
      const paramType = paramTypes[idx]
      if_outputs.push(getValidationFunction(paramType))
      idx += 2
    }

    output += `  ${functionName}(tx, '${param}', ${getValidationLine(
      if_outputs,
    )})\n\n`
  }
  output = output.substring(0, output.length - 1)
  output += '}\n'

  // initial output content
  output = `/**
 * Verify the form and type of a ${txName} at runtime.
 *
 * @param tx - A ${txName} Transaction.
 * @throws When the ${txName} is malformed.
 */
export function validate${txName}(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

${output}`

  return output
}

main().then(console.log)
