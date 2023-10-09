import { assert } from 'chai'

import { ECDSA, Wallet } from '../../src'
import { authorizeChannel } from '../../src/Wallet/authorizeChannel'

it('authorizeChannel succeeds with secp256k1 seed', function () {
  const secpWallet = Wallet.fromSeed('snGHNrPbHrdUcszeuDEigMdC1Lyyd', {
    algorithm: ECDSA.secp256k1,
  })
  const channelId =
    '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3'
  const amount = '1000000'

  assert.equal(
    authorizeChannel(secpWallet, channelId, amount),
    '304402204E7052F33DDAFAAA55C9F5B132A5E50EE95B2CF68C0902F61DFE77299BC893740220353640B951DCD24371C16868B3F91B78D38B6F3FD1E826413CDF891FA8250AAC',
  )
})

it('authorizeChannel succeeds with ed25519 seed', function () {
  const edWallet = Wallet.fromSeed('sEdSuqBPSQaood2DmNYVkwWTn1oQTj2')
  const channelId =
    '5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3'
  const amount = '1000000'
  assert.equal(
    authorizeChannel(edWallet, channelId, amount),
    '7E1C217A3E4B3C107B7A356E665088B4FBA6464C48C58267BEF64975E3375EA338AE22E6714E3F5E734AE33E6B97AAD59058E1E196C1F92346FC1498D0674404',
  )
})
