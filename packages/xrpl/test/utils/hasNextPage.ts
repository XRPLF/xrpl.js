import { assert } from 'chai'
import { hasNextPage } from 'xrpl-local'

import fixtures from '../fixtures/rippled'

describe('hasNextPage', function () {
  it('returns true when response has marker', function () {
    const firstPage = fixtures.ledger_data.first_page
    assert.isTrue(hasNextPage(firstPage))
  })

  it('returns false when response does not have marker', function () {
    const lastPage = fixtures.ledger_data.last_page
    assert.isFalse(hasNextPage(lastPage))
  })
})
