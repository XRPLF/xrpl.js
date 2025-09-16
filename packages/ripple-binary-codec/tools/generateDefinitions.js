if (process.argv.length != 3 && process.argv.length != 4) {
  console.error(
    'Usage: ' +
      process.argv[0] +
      ' ' +
      process.argv[1] +
      ' path/to/rippled [path/to/pipe/to]',
  )
  process.exit(1)
}

////////////////////////////////////////////////////////////////////////
//  Get all necessary files from rippled
////////////////////////////////////////////////////////////////////////
const path = require('path')
const fs = require('fs/promises')

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

const read = (() => {
  try {
    const url = new URL(process.argv[2])
    return url.hostname === 'github.com' ? readFileFromGitHub : readFile
  } catch {
    return readFile // Default to readFile if process.argv[2] is not a valid URL
  }
})()

async function main() {
  const sfieldHeaderFile = await read(
    process.argv[2],
    'include/xrpl/protocol/SField.h',
  )
  const sfieldMacroFile = await read(
    process.argv[2],
    'include/xrpl/protocol/detail/sfields.macro',
  )
  const ledgerFormatsMacroFile = await read(
    process.argv[2],
    'include/xrpl/protocol/detail/ledger_entries.macro',
  )
  const terFile = await read(process.argv[2], 'include/xrpl/protocol/TER.h')
  const transactionsMacroFile = await read(
    process.argv[2],
    'include/xrpl/protocol/detail/transactions.macro',
  )

  const capitalizationExceptions = {
    XCHAIN: 'XChain',
  }

  // Translate from rippled string format to what the binary codecs expect
  function translate(inp) {
    try {
      if (inp.match(/^UINT/m))
        if (
          inp.match(/256/m) ||
          inp.match(/160/m) ||
          inp.match(/128/m) ||
          inp.match(/192/m)
        )
          return inp.replace('UINT', 'Hash')
        else return inp.replace('UINT', 'UInt')

      const nonstandardRenames = {
        OBJECT: 'STObject',
        ARRAY: 'STArray',
        AMM: 'AMM',
        ACCOUNT: 'AccountID',
        LEDGERENTRY: 'LedgerEntry',
        NOTPRESENT: 'NotPresent',
        PATHSET: 'PathSet',
        VL: 'Blob',
        DIR_NODE: 'DirectoryNode',
        PAYCHAN: 'PayChannel',
      }
      if (nonstandardRenames[inp] != null) return nonstandardRenames[inp]

      const parts = inp.split('_')
      let result = ''
      for (x in parts)
        if (capitalizationExceptions[parts[x]] != null) {
          result += capitalizationExceptions[parts[x]]
        } else
          result +=
            parts[x].substr(0, 1).toUpperCase() +
            parts[x].substr(1).toLowerCase()
      return result
    } catch (e) {
      console.error(e, 'inp="' + inp + '"')
    }
  }

  let output = ''
  function addLine(line) {
    output += line + '\n'
  }

  function sorter(a, b) {
    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  addLine('{')

  // process STypes
  let stypeHits = [
    ...sfieldHeaderFile.matchAll(
      /^ *STYPE\(STI_([^ ]*?) *, *([0-9-]+) *\) *\\?$/gm,
    ),
  ]
  if (stypeHits.length === 0)
    stypeHits = [
      ...sfieldHeaderFile.matchAll(/^ *STI_([^ ]*?) *= *([0-9-]+) *,?$/gm),
    ]
  const stypeMap = {}
  stypeHits.forEach(([_, key, value]) => {
    stypeMap[key] = value
  })

  ////////////////////////////////////////////////////////////////////////
  //  SField processing
  ////////////////////////////////////////////////////////////////////////
  addLine('  "FIELDS": [')
  // The ones that are harder to parse directly from SField.cpp
  addLine(`    [
      "Generic",
      {
        "isSerialized": false,
        "isSigningField": false,
        "isVLEncoded": false,
        "nth": 0,
        "type": "Unknown"
      }
    ],
    [
      "Invalid",
      {
        "isSerialized": false,
        "isSigningField": false,
        "isVLEncoded": false,
        "nth": -1,
        "type": "Unknown"
      }
    ],
    [
      "ObjectEndMarker",
      {
        "isSerialized": true,
        "isSigningField": true,
        "isVLEncoded": false,
        "nth": 1,
        "type": "STObject"
      }
    ],
    [
      "ArrayEndMarker",
      {
        "isSerialized": true,
        "isSigningField": true,
        "isVLEncoded": false,
        "nth": 1,
        "type": "STArray"
      }
    ],
    [
      "taker_gets_funded",
      {
        "isSerialized": false,
        "isSigningField": false,
        "isVLEncoded": false,
        "nth": 258,
        "type": "Amount"
      }
    ],
    [
      "taker_pays_funded",
      {
        "isSerialized": false,
        "isSigningField": false,
        "isVLEncoded": false,
        "nth": 259,
        "type": "Amount"
      }
    ],`)

  const isVLEncoded = (t) => {
    if (t == 'VL' || t == 'ACCOUNT' || t == 'VECTOR256') return 'true'
    return 'false'
  }

  const isSerialized = (t, field) => {
    if (
      t == 'LEDGERENTRY' ||
      t == 'TRANSACTION' ||
      t == 'VALIDATION' ||
      t == 'METADATA'
    )
      return 'false'
    if (field == 'hash' || field == 'index') return 'false'
    return 'true'
  }

  const isSigningField = (t, notSigningField) => {
    if (notSigningField == 'notSigning') return 'false'
    if (
      t == 'LEDGERENTRY' ||
      t == 'TRANSACTION' ||
      t == 'VALIDATION' ||
      t == 'METADATA'
    )
      return 'false'
    return 'true'
  }

  // Parse SField.cpp for all the SFields and their serialization info
  let sfieldHits = [
    ...sfieldMacroFile.matchAll(
      /^ *[A-Z]*TYPED_SFIELD *\( *sf([^,\n]*),[ \n]*([^, \n]+)[ \n]*,[ \n]*([0-9]+)(,.*?(notSigning))?/gm,
    ),
  ]
  sfieldHits.push(
    ...[
      ['', 'hash', 'UINT256', '257', '', 'notSigning'],
      ['', 'index', 'UINT256', '258', '', 'notSigning'],
    ],
  )
  sfieldHits.sort((a, b) => {
    const aValue = parseInt(stypeMap[a[2]]) * 2 ** 16 + parseInt(a[3])
    const bValue = parseInt(stypeMap[b[2]]) * 2 ** 16 + parseInt(b[3])
    return aValue - bValue // Ascending order
  })
  for (let x = 0; x < sfieldHits.length; ++x) {
    addLine('    [')
    addLine('      "' + sfieldHits[x][1] + '",')
    addLine('      {')
    addLine(
      '        "isSerialized": ' +
        isSerialized(sfieldHits[x][2], sfieldHits[x][1]) +
        ',',
    )
    addLine(
      '        "isSigningField": ' +
        isSigningField(sfieldHits[x][2], sfieldHits[x][5]) +
        ',',
    )
    addLine('        "isVLEncoded": ' + isVLEncoded(sfieldHits[x][2]) + ',')
    addLine('        "nth": ' + sfieldHits[x][3] + ',')
    addLine('        "type": "' + translate(sfieldHits[x][2]) + '"')
    addLine('      }')
    addLine('    ]' + (x < sfieldHits.length - 1 ? ',' : ''))
  }

  addLine('  ],')

  ////////////////////////////////////////////////////////////////////////
  //  Ledger entry type processing
  ////////////////////////////////////////////////////////////////////////
  addLine('  "LEDGER_ENTRY_TYPES": {')

  const unhex = (x) => {
    x = ('' + x).trim()
    if (x.substr(0, 2) == '0x') return '' + parseInt(x)
    if (x.substr(0, 1) == "'" && x.length == 3) return x.charCodeAt(1)
    return x
  }
  hits = [
    ...ledgerFormatsMacroFile.matchAll(
      /^ *LEDGER_ENTRY[A-Z_]*\(lt[A-Z_]+ *, *([x0-9a-f]+) *, *([^,]+), *([^,]+), \({$/gm,
    ),
  ]
  hits.push(['', '-1', 'Invalid'])
  hits.sort((a, b) => sorter(a[2], b[2]))
  for (let x = 0; x < hits.length; ++x)
    addLine(
      '    "' +
        hits[x][2] +
        '": ' +
        unhex(hits[x][1]) +
        (x < hits.length - 1 ? ',' : ''),
    )
  addLine('  },')

  ////////////////////////////////////////////////////////////////////////
  //  TER code processing
  ////////////////////////////////////////////////////////////////////////
  addLine('  "TRANSACTION_RESULTS": {')
  const cleanedTerFile = ('' + terFile).replace('[[maybe_unused]]', '')

  let terHits = [
    ...cleanedTerFile.matchAll(
      /^ *((tel|tem|tef|ter|tes|tec)[A-Z_]+)( *= *([0-9-]+))? *,? *(\/\/[^\n]*)?$/gm,
    ),
  ]
  let upto = -1
  const terCodes = []
  for (let x = 0; x < terHits.length; ++x) {
    if (terHits[x][4] !== undefined) upto = parseInt(terHits[x][4])
    terCodes.push([terHits[x][1], upto])
    upto++
  }

  terCodes.sort((a, b) => sorter(a[0], b[0]))
  let currentType = ''
  for (let x = 0; x < terCodes.length; ++x) {
    if (currentType === '') {
      currentType = terCodes[x][0].substr(0, 3)
    } else if (currentType != terCodes[x][0].substr(0, 3)) {
      addLine('')
      currentType = terCodes[x][0].substr(0, 3)
    }
    addLine(
      '    "' +
        terCodes[x][0] +
        '": ' +
        terCodes[x][1] +
        (x < terCodes.length - 1 ? ',' : ''),
    )
  }

  addLine('  },')

  ////////////////////////////////////////////////////////////////////////
  //  Transaction type processing
  ////////////////////////////////////////////////////////////////////////
  addLine('  "TRANSACTION_TYPES": {')

  let txHits = [
    ...transactionsMacroFile.matchAll(
      /^ *TRANSACTION\(tt[A-Z_]+ *,* ([0-9]+) *, *([A-Za-z]+).*$/gm,
    ),
  ]
  txHits.push(['', '-1', 'Invalid'])
  txHits.sort((a, b) => sorter(a[2], b[2]))
  for (let x = 0; x < txHits.length; ++x) {
    addLine(
      '    "' +
        txHits[x][2] +
        '": ' +
        txHits[x][1] +
        (x < txHits.length - 1 ? ',' : ''),
    )
  }

  addLine('  },')

  ////////////////////////////////////////////////////////////////////////
  //  Serialized type processing
  ////////////////////////////////////////////////////////////////////////
  addLine('  "TYPES": {')

  stypeHits.push(['', 'DONE', -1])
  stypeHits.sort((a, b) => sorter(translate(a[1]), translate(b[1])))
  for (let x = 0; x < stypeHits.length; ++x) {
    addLine(
      '    "' +
        translate(stypeHits[x][1]) +
        '": ' +
        stypeHits[x][2] +
        (x < stypeHits.length - 1 ? ',' : ''),
    )
  }

  addLine('  }')
  addLine('}')

  const outputFile =
    process.argv.length == 4
      ? process.argv[3]
      : path.join(__dirname, '../src/enums/definitions.json')
  try {
    await fs.writeFile(outputFile, output, 'utf8')
    console.log('File written successfully to', outputFile)
  } catch (err) {
    console.error('Error writing to file:', err)
  }
}

main()
