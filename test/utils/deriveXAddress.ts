import { assert } from 'chai'

import { deriveXAddress } from 'xrpl-local'

describe('client.deriveXAddress', function () {
  it('returns address for public key', function () {
    assert.equal(
      deriveXAddress({
        publicKey:
          '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06',
        tag: false,
        test: false,
      }),
      'XVZVpQj8YSVpNyiwXYSqvQoQqgBttTxAZwMcuJd4xteQHyt',
    )
    assert.equal(
      deriveXAddress({
        publicKey:
          '035332FBA71D705BD5D97014A833BE2BBB25BEFCD3506198E14AFEA241B98C2D06',
        tag: false,
        test: true,
      }),
      'TVVrSWtmQQssgVcmoMBcFQZKKf56QscyWLKnUyiuZW8ALU4',
    )
  })
})
