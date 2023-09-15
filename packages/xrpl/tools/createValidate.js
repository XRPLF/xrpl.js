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

function getIfLineParamPart(param, paramType) {
  if (NORMAL_TYPES.includes(paramType)) {
    return `typeof tx.${param} !== "${paramType}"`
  }
  if (NUMBERS.includes(paramType)) {
    return `tx.${param} !== ${paramType}`
  }
  return `!is${paramType}(tx.${param})`
}

function processModel(model, txName) {
  let output = ''
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
    const split = line.split(' ')
    const param = split[0].replace('?:', '').replace(':', '').trim()
    const paramTypes = split.slice(1)
    const optional = split[0].endsWith('?:')
    if (optional) {
      output += `  if (tx.${param} !== undefined && `
    } else {
      output += `  if (tx.${param} == null) {\n`
      output += `    throw new ValidationError('${txName}: missing field ${param}')\n`
      output += `  }\n\n`
      output += `  if (`
    }
    if (paramTypes.length === 1) {
      const paramType = paramTypes[0]
      output += getIfLineParamPart(param, paramType)
    } else {
      let idx = 0
      const if_outputs = []
      while (idx < paramTypes.length) {
        const paramType = paramTypes[idx]
        if_outputs.push(getIfLineParamPart(param, paramType))
        idx += 2
      }
      output += `(${if_outputs.join(' && ')})`
    }
    output += ') {\n'
    output += `    throw new ValidationError('${txName}: invalid field ${param}')\n`
    output += `  }\n\n`
  }
  output = output.substring(0, output.length - 1)
  output += '}\n'

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
