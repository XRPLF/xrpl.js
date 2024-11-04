/**
 * A script that generates models and model unit tests.
 * To run it, clone the rippled branch with the source code and run this script against that repo.
 */
const fs = require('fs')
const path = require('path')
const createValidate = require('./createValidate')
const createValidateTests = require('./createValidateTests')

function readFile(filename) {
  return fs.readFileSync(filename, 'utf-8')
}

let jsTransactionFile

function processRippledSource(folder) {
  const sfieldCpp = readFile(
    path.join(folder, 'src/libxrpl/protocol/SField.cpp'),
  )
  const sfieldHits = sfieldCpp.match(
    /^ *CONSTRUCT_[^\_]+_SFIELD *\( *[^,\n]*,[ \n]*"([^\"\n ]+)"[ \n]*,[ \n]*([^, \n]+)[ \n]*,[ \n]*([0-9]+)(,.*?(notSigning))?/gm,
  )
  const sfields = {}
  for (const hit of sfieldHits) {
    const matches = hit.match(
      /^ *CONSTRUCT_[^\_]+_SFIELD *\( *[^,\n]*,[ \n]*"([^\"\n ]+)"[ \n]*,[ \n]*([^, \n]+)[ \n]*,[ \n]*([0-9]+)(,.*?(notSigning))?/,
    )
    sfields[matches[1]] = matches.slice(2)
  }

  const txFormatsCpp = readFile(
    path.join(folder, 'src/libxrpl/protocol/TxFormats.cpp'),
  )
  const txFormatsHits = txFormatsCpp.match(
    /^ *add\(jss::([^\"\n, ]+),[ \n]*tt[A-Z_]+,[ \n]*{[ \n]*(({sf[A-Za-z0-9]+, soe(OPTIONAL|REQUIRED|DEFAULT)},[ \n]+)*)},[ \n]*[pseudocC]+ommonFields\);/gm,
  )
  const txFormats = {}
  for (const hit of txFormatsHits) {
    const matches = hit.match(
      /^ *add\(jss::([^\"\n, ]+),[ \n]*tt[A-Z_]+,[ \n]*{[ \n]*(({sf[A-Za-z0-9]+, soe(OPTIONAL|REQUIRED|DEFAULT)},[ \n]+)*)},[ \n]*[pseudocC]+ommonFields\);/,
    )
    txFormats[matches[1]] = formatTxFormat(matches[2])
  }

  jsTransactionFile = readFile(
    path.join(
      path.dirname(__filename),
      '../src/models/transactions/transaction.ts',
    ),
  )
  const transactionMatch = jsTransactionFile.match(
    /export type SubmittableTransaction =([| \nA-Za-z]+)\n\/\*\*/,
  )[0]
  const existingLibraryTxs = transactionMatch
    .replace('\n\n/**', '')
    .split('\n  | ')
    .filter((value) => !value.includes('export type'))
    .map((value) => value.trim())
  existingLibraryTxs.push('EnableAmendment', 'SetFee', 'UNLModify')

  const txsToAdd = []

  for (const tx in txFormats) {
    if (!existingLibraryTxs.includes(tx)) {
      txsToAdd.push(tx)
    }
  }

  return [txsToAdd, txFormats, sfields, transactionMatch]
}

function formatTxFormat(rawTxFormat) {
  return rawTxFormat
    .trim()
    .split('\n')
    .map((element) => element.trim().replace(/[{},]/g, '').split(' '))
}

const typeMap = {
  UINT8: 'number',
  UINT16: 'number',
  UINT32: 'number',
  UINT64: 'number | string',
  UINT128: 'string',
  UINT160: 'string',
  UINT256: 'string',
  AMOUNT: 'Amount',
  VL: 'string',
  ACCOUNT: 'string',
  VECTOR256: 'string[]',
  PATHSET: 'Path[]',
  ISSUE: 'Currency',
  XCHAIN_BRIDGE: 'XChainBridge',
  OBJECT: 'any',
  ARRAY: 'any[]',
}

const allCommonImports = ['Amount', 'Currency', 'Path', 'XChainBridge']
const additionalValidationImports = ['string', 'number']

function updateTransactionFile(transactionMatch, tx) {
  const transactionMatchSplit = transactionMatch.split('\n  | ')
  const firstLine = transactionMatchSplit[0]
  const allTransactions = transactionMatchSplit.slice(1)
  allTransactions.push(tx)
  allTransactions.sort()
  const newTransactionMatch =
    firstLine + '\n  | ' + allTransactions.join('\n  | ')
  let newJsTxFile = jsTransactionFile.replace(
    transactionMatch,
    newTransactionMatch,
  )

  // Adds the imports to the end of the imports
  newJsTxFile = newJsTxFile.replace(
    `import {
  XChainModifyBridge,
  validateXChainModifyBridge,
} from './XChainModifyBridge'`,
    `import {
  XChainModifyBridge,
  validateXChainModifyBridge,
} from './XChainModifyBridge'
import {
  ${tx},
  validate${tx},
} from './${tx}'`,
  )

  const validationMatch = newJsTxFile.match(
    /switch \(tx.TransactionType\) {\n([ \nA-Za-z':()]+)default/,
  )[1]
  const caseValidations = validationMatch.split('\n\n')
  caseValidations.push(
    `    case '${tx}':\n      validate${tx}(tx)\n      break`,
  )
  caseValidations.sort()
  newJsTxFile = newJsTxFile.replace(
    validationMatch,
    caseValidations.join('\n\n') + '\n\n    ',
  )

  fs.writeFileSync(
    path.join(
      path.dirname(__filename),
      '../src/models/transactions/transaction.ts',
    ),
    newJsTxFile,
  )

  transactionMatch = newTransactionMatch
  jsTransactionFile = newJsTxFile
}

function updateIndexFile(tx) {
  const filename = path.join(
    path.dirname(__filename),
    '../src/models/transactions/index.ts',
  )
  let indexFile = readFile(filename)
  indexFile = indexFile.replace(
    `} from './XChainModifyBridge'`,
    `} from './XChainModifyBridge'
export { ${tx} } from './${tx}'`,
  )
  fs.writeFileSync(filename, indexFile)
}

function generateParamLine(sfields, param, isRequired) {
  const paramName = param.slice(2)
  const paramType = sfields[paramName][0]
  const paramTypeOutput = typeMap[paramType]
  return `  ${paramName}${isRequired ? '' : '?'}: ${paramTypeOutput}\n`
}

async function main(folder) {
  const [txsToAdd, txFormats, sfields, transactionMatch] =
    processRippledSource(folder)
  txsToAdd.forEach(async (tx) => {
    const txFormat = txFormats[tx]
    const paramLines = txFormat
      .filter((param) => param[0] !== '')
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map((param) =>
        generateParamLine(sfields, param[0], param[1] === 'soeREQUIRED'),
      )
    paramLines.sort((a, b) => !a.includes('REQUIRED'))
    const params = paramLines.join('\n')
    let model = `/**
 * @category Transaction Models
 */
export interface ${tx} extends BaseTransaction {
  TransactionType: '${tx}'

${params}
}`

    const commonImports = []
    const validationImports = ['BaseTransaction', 'validateBaseTransaction']
    for (const item of allCommonImports) {
      if (params.includes(item)) {
        commonImports.push(item)
        validationImports.push('is' + item)
      }
    }
    for (const item of additionalValidationImports) {
      if (params.includes(item)) {
        validationImports.push(
          'is' + item.substring(0, 1).toUpperCase() + item.substring(1),
        )
      }
    }
    if (params.includes('?')) {
      validationImports.push('validateOptionalField')
    }
    if (/[A-Za-z0-9]+:/.test(params)) {
      validationImports.push('validateRequiredField')
    }
    validationImports.sort()
    const commonImportLine =
      commonImports.length > 0
        ? `import { ${commonImports.join(', ')} } from '../common'`
        : ''
    const validationImportLine = `import { ${validationImports.join(
      ', ',
    )} } from './common'`
    let imported_models = `${commonImportLine}

${validationImportLine}`
    imported_models = imported_models.replace('\n\n\n\n', '\n\n')
    imported_models = imported_models.replace('\n\n\n', '\n\n')
    model = model.replace('\n\n\n\n', '\n\n')
    fs.writeFileSync(
      path.join(
        path.dirname(__filename),
        `../src/models/transactions/${tx}.ts`,
      ),
      imported_models + '\n\n' + model,
    )

    const validate = await createValidate(tx)
    fs.appendFileSync(
      path.join(
        path.dirname(__filename),
        `../src/models/transactions/${tx}.ts`,
      ),
      '\n\n' + validate,
    )

    const validateTests = createValidateTests(tx)
    if (validateTests !== '')
      fs.writeFileSync(
        path.join(path.dirname(__filename), `../test/models/${tx}.test.ts`),
        validateTests,
      )

    updateTransactionFile(transactionMatch, tx)

    updateIndexFile(tx)

    console.log(`Added ${tx}`)
  })
  // TODO: add docstrings to the models and add integration tests
}

if (require.main === module) {
  if (process.argv.length < 3) {
    console.log(`Usage: ${process.argv[0]} ${process.argv[1]} path/to/rippled`)
    process.exit(1)
  }
  main(process.argv[2])
}
