/**
 * A script that generates models and model unit tests.
 * To run it, clone the rippled branch with the source code and run this script against that repo.
 */
const fs = require('fs/promises')
const path = require('path')
const createValidate = require('./createValidate')
const createValidateTests = require('./createValidateTests')

async function readFileFromGitHub(repo, filename) {
  if (!repo.includes('tree')) {
    repo += '/tree/HEAD'
  }
  let url = repo.replace('github.com', 'raw.githubusercontent.com')
  url = url.replace('tree/', '')
  url += '/' + filename

  if (!url.startsWith('http')) {
    url = 'https://' + url
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    return await response.text()
  } catch (e) {
    console.error(`Error reading ${url}: ${e.message}`)
    process.exit(1)
  }
}

async function readFile(folder, filename) {
  const filePath = path.join(folder, filename)
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (e) {
    throw new Error(`File not found: ${filePath}, ${e.message}`)
  }
}

async function processRippledSource(folder) {
  const folderUrl = new URL(folder)
  const read = folderUrl.host === 'github.com' ? readFileFromGitHub : readFile
  const sfieldMacroFile = await read(
    folder,
    'include/xrpl/protocol/detail/sfields.macro',
  )
  const sfieldHits = sfieldMacroFile.matchAll(
    /^ *[A-Z]*TYPED_SFIELD *\( *sf([^,\n]*),[ \n]*([^, \n]+)[ \n]*,[ \n]*([0-9]+)(,.*?(notSigning))?/gm,
  )
  const sfields = {}
  for (const hit of sfieldHits) {
    sfields[hit[1]] = hit[2]
  }

  const transactionsMacroFile = await read(
    folder,
    'include/xrpl/protocol/detail/transactions.macro',
  )
  const txFormatsHits = transactionsMacroFile.matchAll(
    /^ *TRANSACTION\(tt[A-Z_]+ *,* [0-9]+ *, *([A-Za-z]+)[ \n]*,[ \n]*Delegation::[A-Za-z]+[ \n]*,[ \n]*\({[ \n]*(({sf[A-Za-z0-9]+, soe(OPTIONAL|REQUIRED|DEFAULT)(, soeMPT(None|Supported|NotSupported))?},[ \n]+)*)}\)\)$/gm,
  )
  const txFormats = {}
  for (const hit of txFormatsHits) {
    txFormats[hit[1]] = formatTxFormat(hit[2])
  }

  const jsTransactionFile = await readFile(
    path.dirname(__filename),
    '../src/models/transactions/transaction.ts',
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

  return [txsToAdd, txFormats, sfields, transactionMatch, jsTransactionFile]
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

async function updateTransactionFile(transactionMatch, jsTransactionFile, tx) {
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
    /switch \(tx.TransactionType\) {\n([ \nA-Za-z':()\/@\-\.<>=\{\},]+)default/,
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

  await fs.writeFile(
    path.join(
      path.dirname(__filename),
      '../src/models/transactions/transaction.ts',
    ),
    newJsTxFile,
  )

  transactionMatch = newTransactionMatch
  jsTransactionFile = newJsTxFile
}

async function updateIndexFile(tx) {
  let indexFile = await readFile(
    path.dirname(__filename),
    '../src/models/transactions/index.ts',
  )
  indexFile = indexFile.replace(
    `} from './XChainModifyBridge'`,
    `} from './XChainModifyBridge'
export { ${tx} } from './${tx}'`,
  )
  await fs.writeFile(
    path.join(path.dirname(__filename), '../src/models/transactions/index.ts'),
    indexFile,
  )
}

function generateParamLine(sfields, param, isRequired) {
  const paramName = param.slice(2)
  const paramType = sfields[paramName] ?? 'any'
  const paramTypeOutput = typeMap[paramType]
  return `  ${paramName}${isRequired ? '' : '?'}: ${paramTypeOutput}\n`
}

async function main(folder) {
  const [txsToAdd, txFormats, sfields, transactionMatch, jsTransactionFile] =
    await processRippledSource(folder)
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
    await fs.writeFile(
      path.join(
        path.dirname(__filename),
        `../src/models/transactions/${tx}.ts`,
      ),
      imported_models + '\n\n' + model,
    )

    const validate = await createValidate(tx)
    await fs.appendFile(
      path.join(
        path.dirname(__filename),
        `../src/models/transactions/${tx}.ts`,
      ),
      '\n\n' + validate,
    )

    const validateTests = createValidateTests(tx)
    if (validateTests !== '')
      await fs.writeFile(
        path.join(path.dirname(__filename), `../test/models/${tx}.test.ts`),
        validateTests,
      )

    await updateTransactionFile(transactionMatch, jsTransactionFile, tx)

    await updateIndexFile(tx)

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
