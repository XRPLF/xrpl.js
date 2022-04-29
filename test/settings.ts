import assert from 'assert-diff'
import accountSetWithDeletedNode from './fixtures/rippled/account-set-with-deleted-node.json'
import parseSettings from '../src/ledger/parse/settings'

describe('Settings unit tests', function () {
  it('parseSettings does not error with DeletedNode', function () {
    assert.deepStrictEqual(
        parseSettings(accountSetWithDeletedNode.result),
        {}
      )
    })
})
