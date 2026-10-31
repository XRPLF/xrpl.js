import {
  DirectoryNodeFlags,
  LoanBrokerFlags,
  MPTokenFlags,
  NFTokenOfferFlags,
} from '../../src/models/ledger'

/**
 * Ledger entry flags, at the values of the network's server_definitions
 * LEDGER_ENTRY_FLAGS.
 */
describe('ledger entry flags', function () {
  it('LoanBroker', function () {
    expect({ ...LoanBrokerFlags }).toMatchObject({
      lsfLoanBrokerPrivate: 0x00010000,
    })
  })

  it('MPToken', function () {
    expect({ ...MPTokenFlags }).toMatchObject({
      lsfMPTLocked: 0x00000001,
      lsfMPTAuthorized: 0x00000002,
      lsfMPTAMM: 0x00000004,
    })
  })

  it('DirectoryNode', function () {
    expect({ ...DirectoryNodeFlags }).toMatchObject({
      lsfNFTokenBuyOffers: 0x00000001,
      lsfNFTokenSellOffers: 0x00000002,
    })
  })

  it('NFTokenOffer', function () {
    expect({ ...NFTokenOfferFlags }).toMatchObject({
      lsfSellNFToken: 0x00000001,
    })
  })
})
