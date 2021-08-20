// import {Client} from 'xrpl-local'
// import assert from 'assert-diff'
import { TestSuite, assertRejects} from '../../utils'
// import responses from '../../fixtures/responses'
import hashes from '../../fixtures/hashes.json'
// import addresses from '../../fixtures/addresses.json'
// const utils = Client._PRIVATE.ledgerUtils
// const {getTransactions: RESPONSE_FIXTURES} = responses

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  // 'default': async (client, address) => {
  //   const options = {types: ['payment', 'order'], initiated: true, limit: 2}
  //   const response = await client.getTransactions(address, options)
  //   hack(response)
  //   assertResultMatch(response, RESPONSE_FIXTURES.normal, 'getTransactions')
  // },

  // 'include raw transactions': async (client, address) => {
  //   const options = {
  //     types: ['payment', 'order'],
  //     initiated: true,
  //     limit: 2,
  //     includeRawTransactions: true
  //   }
  //   const response = await client.getTransactions(address, options)
  //   assertResultMatch(
  //     response,
  //     RESPONSE_FIXTURES.includeRawTransactions,
  //     'getTransactions'
  //   )
  // },

  // 'earliest first': async (client, address) => {
  //   const options = {
  //     types: ['payment', 'order'],
  //     initiated: true,
  //     limit: 2,
  //     earliestFirst: true
  //   }
  //   const expected = Array.from(RESPONSE_FIXTURES.normal as any[]).sort(
  //     utils.compareTransactions
  //   )
  //   const response = await client.getTransactions(address, options)
  //   hack(response)
  //   assertResultMatch(response, expected, 'getTransactions')
  // },

  // 'earliest first with start option': async (client, address) => {
  //   const options = {
  //     types: ['payment', 'order'],
  //     initiated: true,
  //     limit: 2,
  //     start: hashes.VALID_TRANSACTION_HASH,
  //     earliestFirst: true
  //   }
  //   const response = await client.getTransactions(address, options)
  //   assert.strictEqual(response.length, 0)
  // },

  // 'gap': async (client, address) => {
  //   const options = {
  //     types: ['payment', 'order'],
  //     initiated: true,
  //     limit: 2,
  //     maxLedgerVersion: 348858000
  //   }
  //   return assertRejects(
  //     client.getTransactions(address, options),
  //     client.errors.MissingLedgerHistoryError
  //   )
  // },

  'tx not found': async (client, address) => {
    const options = {
      types: ['payment', 'order'],
      initiated: true,
      limit: 2,
      start: hashes.NOTFOUND_TRANSACTION_HASH,
      counterparty: address
    }
    return assertRejects(
      client.getTransactions(address, options),
      client.errors.NotFoundError
    )
  },

  // 'filters': async (client, address) => {
  //   const options = {
  //     types: ['payment', 'order'],
  //     initiated: true,
  //     limit: 10,
  //     excludeFailures: true,
  //     counterparty: addresses.ISSUER
  //   }
  //   const response = await client.getTransactions(address, options)
  //   hack(response)
  //   assert.strictEqual(response.length, 10)
  //   response.forEach((t) => assert(t.type === 'payment' || t.type === 'order'))
  //   response.forEach((t) => assert(t.outcome.result === 'tesSUCCESS'))
  // },

  // 'filters for incoming': async (client, address) => {
  //   const options = {
  //     types: ['payment', 'order'],
  //     initiated: false,
  //     limit: 10,
  //     excludeFailures: true,
  //     counterparty: addresses.ISSUER
  //   }
  //   const response = await client.getTransactions(address, options)
  //   hack(response)
  //   assert.strictEqual(response.length, 10)
  //   response.forEach((t) => assert(t.type === 'payment' || t.type === 'order'))
  //   response.forEach((t) => assert(t.outcome.result === 'tesSUCCESS'))
  // },

  // this is the case where core.RippleError just falls
  // through the client to the user
  'error': async (client, address) => {
    const options = {types: ['payment', 'order'], initiated: true, limit: 13}
    return assertRejects(
      client.getTransactions(address, options),
      client.errors.RippleError
    )
  },

  // TODO: this doesn't test much, just that it doesn't crash
  // 'getTransactions with start option': async (client, address) => {
  //   const options = {
  //     start: hashes.VALID_TRANSACTION_HASH,
  //     earliestFirst: false,
  //     limit: 2
  //   }
  //   const response = await client.getTransactions(address, options)
  //   hack(response)
  //   assertResultMatch(response, RESPONSE_FIXTURES.normal, 'getTransactions')
  // },

  // 'start transaction with zero ledger version': async (client, address) => {
  //   const options = {
  //     start: '4FB3ADF22F3C605E23FAEFAA185F3BD763C4692CAC490D9819D117CD33BFAA13',
  //     limit: 1
  //   }
  //   const response = await client.getTransactions(address, options)
  //   hack(response)
  //   assertResultMatch(response, [], 'getTransactions')
  // },

  // 'no options': async (client, address) => {
  //   const response = await client.getTransactions(addresses.OTHER_ACCOUNT)
  //   assertResultMatch(response, RESPONSE_FIXTURES.one, 'getTransactions')
  // }
  
}

// This test relies on the binary (hex string) format, but computed fields like `date`
// are not available in this format. To support this field, we need to 'hack' it into
// the expected response. Long term, a better approach would be to use/test the json
// format responses, instead of the binary.
// function hack(response) {
//   response.forEach((element) => {
//     element.outcome.timestamp = '2019-04-01T07:39:01.000Z'
//   })
// }
