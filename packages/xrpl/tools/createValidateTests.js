const fs = require('fs')
const path = require('path')
const fixtures = require('../../ripple-binary-codec/test/fixtures/codec-fixtures.json')

const NORMAL_TYPES = ['number', 'string']
const NUMBERS = ['0', '1']

function getTx(txName) {
  transactions = fixtures.transactions
  const validTxs = fixtures.transactions
    .filter((tx) => tx.json.TransactionType === txName)
    .map((tx) => tx.json)
  if (validTxs.length == 0) {
    throw new Error(`Must have ripple-binary-codec fixture for ${txName}`)
  }
  const validTx = validTxs[0]
  delete validTx.TxnSignature
  delete validTx.SigningPubKey
  return JSON.stringify(validTx, null, 2)
}

function main(modelName) {
  const filename = path.join(
    path.dirname(__filename),
    `../src/models/transactions/${modelName}.ts`,
  )
  const [model, txName] = getModel(filename)
  return processModel(model, txName)
}

// Extract just the model from the file
function getModel(filename) {
  let model = ''
  let started = false
  let ended = false
  const data = fs.readFileSync(filename, 'utf8')
  const lines = data.split('\n')
  for (let line of lines) {
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
    model += line + '\n'
    if (line === '}') {
      ended = true
    }
  }
  const name_line = model.split('\n')[0].split(' ')
  const txName = name_line[2]
  return [model, txName]
}

function getInvalidValue(paramTypes) {
  if (paramTypes.length === 1) {
    const paramType = paramTypes[0]
    if (paramType == 'number') {
      return "'number'"
    } else if (paramType == 'string') {
      return 123
    } else if (paramType == 'IssuedCurrency') {
      return JSON.stringify({ test: 'test' })
    } else if (paramType == 'Currency') {
      return JSON.stringify({ test: 'test' })
    } else if (paramType == 'Amount') {
      return JSON.stringify({ currency: 'ETH' })
    } else if (paramType == 'XChainBridge') {
      return JSON.stringify({ XChainDoor: 'test' })
    } else {
      throw Error(`${paramType} not supported yet`)
    }
  }

  const simplifiedParamTypes = paramTypes.filter(
    (_paramType, index) => index % 2 == 0,
  )
  if (JSON.stringify(simplifiedParamTypes) === '["0","1"]') {
    return 2
  } else if (JSON.stringify(simplifiedParamTypes) === '["number","string"]') {
    return JSON.stringify({ currency: 'ETH' })
  } else {
    throw Error(`${simplifiedParamTypes} not supported yet`)
  }
}

// Process the model and build the tests

function processModel(model, txName) {
  let output = ''
  for (let line of model.split('\n')) {
    if (line == '') {
      continue
    }
    if (line.startsWith('export')) {
      continue
    }
    if (line == '}') {
      continue
    }
    line = line.trim()
    if (line.startsWith('TransactionType')) {
      continue
    }
    if (line.startsWith('Flags')) {
      // TODO: support flag checking
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

    if (!optional) {
      output += `  it("throws w/ missing ${param}", function () {
    delete tx.${param}

    assert.throws(
      () => validate${txName}(tx),
      ValidationError,
      '${txName}: missing field ${param}',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      '${txName}: missing field ${param}',
    )
  })

`
    }

    const fakeValue = getInvalidValue(paramTypes)
    output += `  it('throws w/ invalid ${param}', function () {
    tx.${param} = ${fakeValue}

    assert.throws(
      () => validate${txName}(tx),
      ValidationError,
      '${txName}: invalid field ${param}',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      '${txName}: invalid field ${param}',
    )
  })

`
  }

  output = output.substring(0, output.length - 2)
  output += '\n})\n'
  output =
    `import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validate${txName} } from '../../src/models/transactions/${txName}'

/**
 * ${txName} Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('${txName}', function () {
  let tx

  beforeEach(function () {
    tx = ${getTx(txName)} as any
  })

  it('verifies valid ${txName}', function () {
    assert.doesNotThrow(() => validate${txName}(tx))
    assert.doesNotThrow(() => validate(tx))
  })

` + output

  return output
}

if (require.main === module) {
  if (process.argv.length < 3) {
    console.log(`Usage: ${process.argv[0]} ${process.argv[1]} TxName`)
    process.exit(1)
  }
  console.log(main(process.argv[2]))
}

module.exports = main
