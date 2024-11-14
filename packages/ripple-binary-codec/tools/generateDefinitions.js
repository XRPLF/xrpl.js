if (process.argv.length != 3) {
  console.log(
    'Usage: ' + process.argv[0] + ' ' + process.argv[1] + ' path/to/rippled',
  )
  process.exit(1)
}

////////////////////////////////////////////////////////////////////////
//  Get all necessary files from rippled
////////////////////////////////////////////////////////////////////////
const path = require('path')

const fs = require('fs')
function readFile(filename) {
  try {
    return fs.readFileSync(filename).toString('utf-8')
  } catch (err) {
    console.error(`Error reading file ${filename}:`, err.message)
    process.exit(1)
  }
}

const sfieldHeaderFile = readFile(
  path.join(process.argv[2], '/include/xrpl/protocol/SField.h'),
)
const sfieldMacroFile = readFile(
  path.join(process.argv[2], '/include/xrpl/protocol/detail/sfields.macro'),
)
const ledgerFormatsMacroFile = readFile(
  path.join(
    process.argv[2],
    '/include/xrpl/protocol/detail/ledger_entries.macro',
  ),
)
const terFile = readFile(
  path.join(process.argv[2], '/include/xrpl/protocol/TER.h'),
)
const transactionsMacro = readFile(
  path.join(
    process.argv[2],
    '/include/xrpl/protocol/detail/transactions.macro',
  ),
)

const capitalizationExceptions = {
  NFTOKEN: 'NFToken',
  URITOKEN: 'URIToken',
  URI: 'URI',
  UNL: 'UNL',
  XCHAIN: 'XChain',
  DID: 'DID',
  ID: 'ID',
  AMM: 'AMM',
}

// Translate from rippled string format to what the binary codecs expect
function translate(inp) {
  try {
    if (inp.match(/^UINT/m))
      if (inp.match(/256/m) || inp.match(/160/m) || inp.match(/128/m))
        return inp.replace('UINT', 'Hash')
      else return inp.replace('UINT', 'UInt')
    if (inp == 'OBJECT' || inp == 'ARRAY')
      return 'ST' + inp.substr(0, 1).toUpperCase() + inp.substr(1).toLowerCase()
    if (inp == 'AMM') return inp
    if (inp == 'ACCOUNT') return 'AccountID'
    if (inp == 'LEDGERENTRY') return 'LedgerEntry'
    if (inp == 'NOTPRESENT') return 'NotPresent'
    if (inp == 'PATHSET') return 'PathSet'
    if (inp == 'VL') return 'Blob'
    if (inp == 'DIR_NODE') return 'DirectoryNode'
    if (inp == 'PAYCHAN') return 'PayChannel'

    const parts = inp.split('_')
    let result = ''
    for (x in parts)
      if (capitalizationExceptions[parts[x]] != null) {
        result += capitalizationExceptions[parts[x]]
      } else
        result +=
          parts[x].substr(0, 1).toUpperCase() + parts[x].substr(1).toLowerCase()
    return result
  } catch (e) {
    console.log(e, 'inp="' + inp + '"')
  }
}

////////////////////////////////////////////////////////////////////////
//  Serialized type processing
////////////////////////////////////////////////////////////////////////
console.log('{')
console.log('  "TYPES": {')
console.log('    "Done": -1,')

let stypeHits = [
  ...sfieldHeaderFile.matchAll(
    /^ *STYPE\(STI_([^ ]*?) *, *([0-9-]+) *\) *\\?$/gm,
  ),
]
if (stypeHits.length === 0)
  stypeHits = [
    ...sfieldHeaderFile.matchAll(/^ *STI_([^ ]*?) *= *([0-9-]+) *,?$/gm),
  ]
for (let x = 0; x < stypeHits.length; ++x) {
  console.log(
    '    "' +
      translate(stypeHits[x][1]) +
      '": ' +
      stypeHits[x][2] +
      (x < stypeHits.length - 1 ? ',' : ''),
  )
}

console.log('  },')

////////////////////////////////////////////////////////////////////////
//  Ledger entry type processing
////////////////////////////////////////////////////////////////////////
console.log('  "LEDGER_ENTRY_TYPES": {')
console.log('    "Any": -3,')
console.log('    "Child": -2,')
console.log('    "Invalid": -1,')

const unhex = (x) => {
  x = ('' + x).trim()
  if (x.substr(0, 2) == '0x') return '' + parseInt(x)
  if (x.substr(0, 1) == "'" && x.length == 3) return x.charCodeAt(1)
  return x
}
hits = [
  ...ledgerFormatsMacroFile.matchAll(
    /^ *LEDGER_ENTRY\(lt[A-Z_]+ *, *([x0-9a-f]+) *, *([^,]+), \({$/gm,
  ),
]
for (let x = 0; x < hits.length; ++x)
  console.log(
    '    "' +
      hits[x][2] +
      '": ' +
      unhex(hits[x][1]) +
      (x < hits.length - 1 ? ',' : ''),
  )
console.log('  },')

////////////////////////////////////////////////////////////////////////
//  SField processing
////////////////////////////////////////////////////////////////////////
console.log('  "FIELDS": [')
// The ones that are harder to parse directly from SField.cpp
console.log(`    [
      "Generic",
      {
        "nth": 0,
        "isVLEncoded": false,
        "isSerialized": false,
        "isSigningField": false,
        "type": "Unknown"
      }
    ],
    [
      "Invalid",
      {
        "nth": -1,
        "isVLEncoded": false,
        "isSerialized": false,
        "isSigningField": false,
        "type": "Unknown"
      }
    ],
    [
      "ObjectEndMarker",
      {
        "nth": 1,
        "isVLEncoded": false,
        "isSerialized": true,
        "isSigningField": true,
        "type": "STObject"
      }
    ],
    [
      "ArrayEndMarker",
      {
        "nth": 1,
        "isVLEncoded": false,
        "isSerialized": true,
        "isSigningField": true,
        "type": "STArray"
      }
    ],
    [
      "hash",
      {
        "nth": 257,
        "isVLEncoded": false,
        "isSerialized": false,
        "isSigningField": false,
        "type": "Hash256"
      }
    ],
    [
      "index",
      {
        "nth": 258,
        "isVLEncoded": false,
        "isSerialized": false,
        "isSigningField": false,
        "type": "Hash256"
      }
    ],
    [
      "taker_gets_funded",
      {
        "nth": 258,
        "isVLEncoded": false,
        "isSerialized": false,
        "isSigningField": false,
        "type": "Amount"
      }
    ],
    [
      "taker_pays_funded",
      {
        "nth": 259,
        "isVLEncoded": false,
        "isSerialized": false,
        "isSigningField": false,
        "type": "Amount"
      }
    ],`)

const isVLEncoded = (t) => {
  if (t == 'VL' || t == 'ACCOUNT' || t == 'VECTOR256') return 'true'
  return 'false'
}

const isSerialized = (t) => {
  if (
    t == 'LEDGERENTRY' ||
    t == 'TRANSACTION' ||
    t == 'VALIDATION' ||
    t == 'METADATA'
  )
    return 'false'
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
for (let x = 0; x < sfieldHits.length; ++x) {
  console.log('    [')
  console.log('      "' + sfieldHits[x][1] + '",')
  console.log('      {')
  console.log('        "nth": ' + sfieldHits[x][3] + ',')
  console.log('        "isVLEncoded": ' + isVLEncoded(sfieldHits[x][2]) + ',')
  console.log('        "isSerialized": ' + isSerialized(sfieldHits[x][2]) + ',')
  console.log(
    '        "isSigningField": ' +
      isSigningField(sfieldHits[x][2], sfieldHits[x][5]) +
      ',',
  )
  console.log('        "type": "' + translate(sfieldHits[x][2]) + '"')
  console.log('      }')
  console.log('    ]' + (x < sfieldHits.length - 1 ? ',' : ''))
}

console.log('  ],')

////////////////////////////////////////////////////////////////////////
//  TER code processing
////////////////////////////////////////////////////////////////////////
console.log('  "TRANSACTION_RESULTS": {')
const cleanedTerFile = ('' + terFile).replace('[[maybe_unused]]', '')

let terHits = [
  ...cleanedTerFile.matchAll(
    /^ *((tel|tem|tef|ter|tes|tec)[A-Z_]+)( *= *([0-9-]+))? *,? *(\/\/[^\n]*)?$/gm,
  ),
]
let upto = -1
let last = ''
for (let x = 0; x < terHits.length; ++x) {
  if (terHits[x][4] !== undefined) upto = terHits[x][4]

  let current = terHits[x][2]
  if (current != last && last != '') console.log('')
  last = current

  console.log(
    '    "' +
      terHits[x][1] +
      '": ' +
      upto +
      (x < terHits.length - 1 ? ',' : ''),
  )

  upto++
}

console.log('  },')

////////////////////////////////////////////////////////////////////////
//  Transaction type processing
////////////////////////////////////////////////////////////////////////
console.log('  "TRANSACTION_TYPES": {')
console.log('    "Invalid": -1,')

let txHits = [
  ...transactionsMacro.matchAll(
    /^ *TRANSACTION\(tt[A-Z_]+ *,* ([0-9]+) *, *([A-Za-z]+).*$/gm,
  ),
]
for (let x = 0; x < txHits.length; ++x) {
  console.log(
    '    "' +
      txHits[x][2] +
      '": ' +
      txHits[x][1] +
      (x < txHits.length - 1 ? ',' : ''),
  )
}

console.log('  }')
console.log('}')
