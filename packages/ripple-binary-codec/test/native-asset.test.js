const { encode } = require('./../src/index')
const { nativeAsset } = require('./../src/nativeasset')

const baseTxXrp = {
  TransactionType: 'TrustSet',
  Account: 'ra5nK24KXen9AHvsdFTKHSANinZseWnPcX',
  LimitAmount: {
    currency: 'XRP',
    issuer: 'rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc',
    value: '100',
  },
}

const baseTxXah = {
  TransactionType: 'TrustSet',
  Account: 'ra5nK24KXen9AHvsdFTKHSANinZseWnPcX',
  LimitAmount: {
    currency: 'XAH',
    issuer: 'rsP3mgGb2tcYUrxiLFiHJiQXhsziegtwBc',
    value: '100',
  },
}

describe('XRP Native asset', function () {
  it('XRP as native to be native', function () {
    nativeAsset.set('XRP')

    expect(encode(baseTxXrp).slice(24, 64)).toEqual(
      '0000000000000000000000000000000000000000',
    )
  })
  it('XRP as non-native to be non-native', function () {
    nativeAsset.set('XAH')

    expect(encode(baseTxXrp).slice(24, 64)).toEqual(
      '0000000000000000000000005852500000000000',
    )
  })
  it('XAH as native to be native', function () {
    nativeAsset.set('XAH')

    expect(encode(baseTxXah).slice(24, 64)).toEqual(
      '0000000000000000000000000000000000000000',
    )
  })
  it('XAH as non-native to be non-native', function () {
    nativeAsset.set('XRP')

    expect(encode(baseTxXah).slice(24, 64)).toEqual(
      '0000000000000000000000005841480000000000',
    )
  })
})
