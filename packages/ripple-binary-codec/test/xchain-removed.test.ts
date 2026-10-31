import { coreTypes } from '../src/types'

describe('XChain removed', function () {
  it('has no XChainBridge type', function () {
    expect(Object.keys(coreTypes)).not.toContain('XChainBridge')
  })
})
