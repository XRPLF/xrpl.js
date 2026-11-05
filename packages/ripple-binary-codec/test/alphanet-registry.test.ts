import definitions from '../src/enums/definitions.json'

import registry from './fixtures/alphanet-registry.json'

// The alphanet registry's serialized type names, as definitions.json spells them
const FIELD_TYPES: Record<string, string> = {
  ACCOUNT: 'AccountID',
  AMOUNT: 'Amount',
  ARRAY: 'STArray',
  CURRENCY: 'Currency',
  DATA: 'Data',
  DATATYPE: 'DataType',
  INT32: 'Int32',
  ISSUE: 'Issue',
  JSON: 'Json',
  NUMBER: 'Number',
  OBJECT: 'STObject',
  UINT8: 'UInt8',
  UINT16: 'UInt16',
  UINT32: 'UInt32',
  UINT64: 'UInt64',
  UINT256: 'Hash256',
  VECTOR256: 'Vector256',
  VL: 'Blob',
}

// Each block is one inclusive range, [low, high]
type Block = [number, number]

function numbers([low, high]: Block): number[] {
  const [from, to] = low <= high ? [low, high] : [high, low]
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

const transactionTypes = new Set(
  Object.values(definitions.TRANSACTION_TYPES as Record<string, number>),
)
const ledgerEntryTypes = new Set(
  Object.values(definitions.LEDGER_ENTRY_TYPES as Record<string, number>),
)
const results = new Set(
  Object.values(definitions.TRANSACTION_RESULTS as Record<string, number>),
)
const serializedTypes = new Set(
  Object.values(definitions.TYPES as Record<string, number>),
)
const fields = new Set(
  (definitions.FIELDS as Array<[string, { type: string; nth: number }]>).map(
    ([, field]) => `${field.type}/${field.nth}`,
  ),
)

function missing(space: string, block: Block): number[] {
  return numbers(block).filter((n) => {
    if (space === 'transaction') return !transactionTypes.has(n)
    if (space === 'ledger_entry') return !ledgerEntryTypes.has(n)
    if (space === 'tec' || space === 'tef') return !results.has(n)
    if (space === 'sti') return !serializedTypes.has(n)
    return !fields.has(`${FIELD_TYPES[space.split('/')[1]]}/${n}`)
  })
}

describe('definitions.json matches the alphanet registry table', function () {
  for (const feature of registry.features) {
    // Namespace characters and key types are not in definitions.json
    const checked = Object.entries(feature.blocks).filter(
      ([space]) => space !== 'namespace' && space !== 'key_type',
    )
    for (const [space, block] of checked) {
      it(`${feature.id} ${space}`, function () {
        expect(missing(space, block as Block)).toEqual([])
      })
    }
  }
})
