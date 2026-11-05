import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

import definitions from '../src/enums/definitions.json'

// Each fixture holds the entries one rippled xrplf/<feature> branch adds over its base
interface Delta {
  TYPES?: Record<string, number>
  TRANSACTION_TYPES?: Record<string, number>
  LEDGER_ENTRY_TYPES?: Record<string, number>
  TRANSACTION_RESULTS?: Record<string, number>
  FIELDS?: Array<[string, Record<string, unknown>]>
}

const MAPS = [
  'TYPES',
  'TRANSACTION_TYPES',
  'LEDGER_ENTRY_TYPES',
  'TRANSACTION_RESULTS',
] as const

const fixtures = join(__dirname, 'fixtures')
const maps = definitions as unknown as Record<string, Record<string, number>>
const fields = new Map(
  (definitions.FIELDS as Array<[string, Record<string, unknown>]>).map(
    ([name, field]) => [name, field],
  ),
)

describe('definitions.json carries every rippled feature branch entry', function () {
  const deltas: Array<[string, Delta]> = []

  beforeAll(async function () {
    const names = (await readdir(fixtures))
      .filter((name) => /^rippled-.+-delta\.json$/u.test(name))
      .sort()
    const texts = await Promise.all(
      names.map(async (name) => readFile(join(fixtures, name), 'utf8')),
    )
    names.forEach((name, i) => {
      deltas.push([name, JSON.parse(texts[i]) as Delta])
    })
  })

  it('finds at least one delta fixture', function () {
    expect(deltas.length).toBeGreaterThan(0)
  })

  it('has every delta entry at the same value', function () {
    for (const [name, delta] of deltas) {
      for (const map of MAPS) {
        expect([name, map, maps[map]]).toMatchObject([
          name,
          map,
          delta[map] ?? {},
        ])
      }
      for (const [field, value] of delta.FIELDS ?? []) {
        expect([name, field, fields.get(field)]).toEqual([name, field, value])
      }
    }
  })
})
