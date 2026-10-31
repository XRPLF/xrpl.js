import definitions from '../src/enums/definitions.json'

import network from './fixtures/alphanet-server-definitions.json'

interface FieldInfo {
  nth: number
  type: string
  isSerialized: boolean
  isSigningField: boolean
  isVLEncoded: boolean
}

type FieldRow = [string, FieldInfo]

interface Difference {
  absent: string[]
  extra: string[]
  differing: string[]
}

// Names the network has and definitions.json lacks, the reverse, and names whose values differ
function difference(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): Difference {
  const actualNames = Object.keys(actual)
  const expectedNames = Object.keys(expected)
  return {
    absent: expectedNames.filter((name) => !(name in actual)),
    extra: actualNames.filter((name) => !(name in expected)),
    differing: expectedNames.filter(
      (name) =>
        name in actual &&
        JSON.stringify(actual[name]) !== JSON.stringify(expected[name]),
    ),
  }
}

// Each field's serialization attributes, keyed by field name
function fieldsByName(fields: FieldRow[]): Record<string, FieldInfo> {
  return Object.fromEntries(
    fields.map(([name, info]) => [
      name,
      {
        nth: info.nth,
        type: info.type,
        isSerialized: info.isSerialized,
        isSigningField: info.isSigningField,
        isVLEncoded: info.isVLEncoded,
      },
    ]),
  )
}

const NONE: Difference = { absent: [], extra: [], differing: [] }

const ENUMS = [
  'TYPES',
  'LEDGER_ENTRY_TYPES',
  'TRANSACTION_TYPES',
  'TRANSACTION_RESULTS',
] as const

describe(`definitions.json matches alphanet server_definitions ${network.hash.slice(0, 10)}`, function () {
  for (const key of ENUMS) {
    it(key, function () {
      expect(
        difference(
          definitions[key] as Record<string, number>,
          network[key] as Record<string, number>,
        ),
      ).toEqual(NONE)
    })
  }

  it('FIELDS', function () {
    expect(
      difference(
        fieldsByName(definitions.FIELDS as FieldRow[]),
        fieldsByName(network.FIELDS as FieldRow[]),
      ),
    ).toEqual(NONE)
  })
})
