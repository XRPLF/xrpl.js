import assert from 'assert-diff'
import {deriveAddress} from 'ripple-keypairs/dist'

describe('Derive Address', function () {
  it('returns address for public key', () => {
    var derivedAddress = deriveAddress(
      '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06'
    )
    assert.equal(derivedAddress, 'rLczgQHxPhWtjkaQqn3Q6UM8AbRbbRvs5K')
  })

  it('Jackson'), () => {
    assert.equal(1, 1)
  }
})
