import {RippledError, ValidationError} from 'ripple-api/common/errors'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import {assertRejects, assertResultMatch, TestSuite} from '../../utils'
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}

export const config = {
  // TODO: The mock server right now returns a hard-coded string, no matter
  // what "Account" value you pass. We'll need it to support more accurate
  // responses before we can turn these tests on.
  skipXAddress: true
}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'auto-fillable fields - does not overwrite Fee in txJSON': async (
    api,
    address
  ) => {
    const localInstructions = instructionsWithMaxLedgerVersionOffset
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '10'
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"10","Sequence":23}`,
      instructions: {
        fee: '0.00001', // Notice there are not always 6 digits after the decimal point as trailing zeros are omitted
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'does not overwrite Fee in Instructions': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      fee: '0.000014' // CAUTION: This `fee` is specified in XRP, not drops.
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"14","Sequence":23}`,
      instructions: {
        fee: '0.000014',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'rejects Promise if both are set, even when txJSON.Fee matches instructions.fee': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      fee: '0.000016'
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '16'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      '`Fee` in txJSON and `fee` in `instructions` cannot both be set'
    )
  },

  'rejects Promise if both are set, when txJSON.Fee does not match instructions.fee': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      fee: '0.000018'
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '20'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      '`Fee` in txJSON and `fee` in `instructions` cannot both be set'
    )
  },

  'rejects Promise when the Fee is capitalized in Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      Fee: '0.000022' // Intentionally capitalized in this test, but the correct field would be `fee`
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance additionalProperty "Fee" exists in instance when not allowed'
    )
  },

  'rejects Promise when the fee is specified in txJSON': async (
    api,
    address
  ) => {
    const localInstructions = instructionsWithMaxLedgerVersionOffset
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      fee: '10'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'txJSON additionalProperty "fee" exists in instance when not allowed'
    )
  },

  'does not overwrite Sequence in txJSON': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Sequence: 100
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":100}`,
      instructions: {
        fee: '0.000012',
        sequence: 100,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'does not overwrite Sequence in Instructions': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      sequence: 100
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":100}`,
      instructions: {
        fee: '0.000012',
        sequence: 100,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'does not overwrite Sequence when same sequence is provided in both txJSON and Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      sequence: 100
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Sequence: 100
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":100}`,
      instructions: {
        fee: '0.000012',
        sequence: 100,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'rejects Promise when Sequence in txJSON does not match sequence in Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      sequence: 100
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Sequence: 101
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      '`Sequence` in txJSON must match `sequence` in `instructions`'
    )
  },

  'rejects Promise when the Sequence is capitalized in Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      Sequence: 100 // Intentionally capitalized in this test, but the correct field would be `sequence`
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance additionalProperty "Sequence" exists in instance when not allowed'
    )
  },

  // LastLedgerSequence aka maxLedgerVersion/maxLedgerVersionOffset:

  'does not overwrite LastLedgerSequence in txJSON': async (api, address) => {
    const localInstructions = {}
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '10',
      LastLedgerSequence: 8880000
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8880000,"Fee":"10","Sequence":23}`,
      instructions: {
        fee: '0.00001', // Notice there are not always 6 digits after the decimal point as trailing zeros are omitted
        sequence: 23,
        maxLedgerVersion: 8880000
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'does not overwrite maxLedgerVersion in Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      maxLedgerVersion: 8890000
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8890000,"Fee":"12","Sequence":23}`,
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8890000
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'does not overwrite maxLedgerVersionOffset in Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxLedgerVersionOffset: 124
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820075,"Fee":"12","Sequence":23}`,
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820075
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'rejects Promise if txJSON.LastLedgerSequence and instructions.maxLedgerVersion both are set': async (
    api,
    address
  ) => {
    const localInstructions = {
      maxLedgerVersion: 8900000
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '16',
      LastLedgerSequence: 8900000
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      '`LastLedgerSequence` in txJSON and `maxLedgerVersion` in `instructions` cannot both be set'
    )
  },

  'rejects Promise if txJSON.LastLedgerSequence and instructions.maxLedgerVersionOffset both are set': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxLedgerVersionOffset: 123
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '16',
      LastLedgerSequence: 8900000
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      '`LastLedgerSequence` in txJSON and `maxLedgerVersionOffset` in `instructions` cannot both be set'
    )
  },

  'rejects Promise if instructions.maxLedgerVersion and instructions.maxLedgerVersionOffset both are set': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxLedgerVersion: 8900000,
      maxLedgerVersionOffset: 123
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '16'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance is of prohibited type [object Object]'
    )
  },

  'rejects Promise if txJSON.LastLedgerSequence and instructions.maxLedgerVersion and instructions.maxLedgerVersionOffset all are set': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxLedgerVersion: 8900000,
      maxLedgerVersionOffset: 123
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Fee: '16',
      LastLedgerSequence: 8900000
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance is of prohibited type [object Object]'
    )
  },

  'rejects Promise when the maxLedgerVersion is capitalized in Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      MaxLedgerVersion: 8900000 // Intentionally capitalized in this test, but the correct field would be `maxLedgerVersion`
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance additionalProperty "MaxLedgerVersion" exists in instance when not allowed'
    )
  },

  'rejects Promise when the maxLedgerVersion is specified in txJSON': async (
    api,
    address
  ) => {
    const localInstructions = instructionsWithMaxLedgerVersionOffset
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      maxLedgerVersion: 8900000
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'txJSON additionalProperty "maxLedgerVersion" exists in instance when not allowed'
    )
  },

  'rejects Promise when the maxLedgerVersionOffset is specified in txJSON': async (
    api,
    address
  ) => {
    const localInstructions = instructionsWithMaxLedgerVersionOffset
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      maxLedgerVersionOffset: 8900000
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'txJSON additionalProperty "maxLedgerVersionOffset" exists in instance when not allowed'
    )
  },

  'rejects Promise when the sequence is specified in txJSON': async (
    api,
    address
  ) => {
    const localInstructions = instructionsWithMaxLedgerVersionOffset
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      sequence: 8900000
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'txJSON additionalProperty "sequence" exists in instance when not allowed'
    )
  },

  // Paths: is not auto-filled by ripple-lib.

  // Other errors:

  'rejects Promise when an unrecognized field is in Instructions': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012',
      foo: 'bar'
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance additionalProperty "foo" exists in instance when not allowed'
    )
  },

  'rejects Promise when Account is missing': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    // Marking as "any" to get around the fact that TS won't allow this.
    const txJSON: any = {
      TransactionType: 'DepositPreauth',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance requires property "Account"'
    )
  },

  'rejects Promise when Account is not a string': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    // Marking as "any" to get around the fact that TS won't allow this.
    const txJSON: any = {
      Account: 1234,
      TransactionType: 'DepositPreauth',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance.Account is not of a type(s) string,instance.Account is not exactly one from <xAddress>,<classicAddress>'
    )
  },

  'rejects Promise when Account is invalid': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const txJSON = {
      Account: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xkXXXX', // Invalid checksum
      TransactionType: 'DepositPreauth',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance.Account is not exactly one from <xAddress>,<classicAddress>'
    )
  },

  'rejects Promise when Account is valid but non-existent on the ledger': async api => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const txJSON = {
      Account: 'rogvkYnY8SWjxkJNgU4ZRVfLeRyt5DR9i',
      TransactionType: 'DepositPreauth',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      RippledError,
      'Account not found.'
    )
  },

  'rejects Promise when TransactionType is missing': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    // Marking as "any" to get around the fact that TS won't allow this.
    const txJSON: any = {
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance requires property "TransactionType"'
    )
  },

  // Note: This transaction will fail at the `sign` step:
  //
  //   Error: DepositPreXXXX is not a valid name or ordinal for TransactionType
  //
  // at Function.from (ripple-binary-codec/distrib/npm/enums/index.js:43:15)
  'prepares tx when TransactionType is invalid': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const txJSON = {
      Account: address,
      TransactionType: 'DepositPreXXXX',
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreXXXX","Account":"${address}","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":23}`,
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'rejects Promise when TransactionType is not a string': async (
    api,
    address
  ) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    // Marking as "any" to get around the fact that TS won't allow this.
    const txJSON: any = {
      Account: address,
      TransactionType: 1234,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    await assertRejects(
      api.prepareTransaction(txJSON, localInstructions),
      ValidationError,
      'instance.TransactionType is not of a type(s) string'
    )
  },

  // Note: This transaction will fail at the `submit` step:
  //
  // [RippledError(Submit failed, { resultCode: 'temMALFORMED',
  // resultMessage: 'Malformed transaction.',
  // engine_result: 'temMALFORMED',
  // engine_result_code: -299,
  // engine_result_message: 'Malformed transaction.',
  // tx_blob:
  //  '120013240000000468400000000000000C732102E1EA8199F570E7F997A7B34EDFDA0A7D8B38173A17450B121A2EB048FDD16CA97446304402201F0EF6A2DE7F96966F7082294D14F3EC1EF59C21E29443E5858A0120079357A302203CDB7FEBDEAAD93FF39CB589B55778CB80DC3979F96F27E828D5E659BEB26B7A8114D51F9A17208CF113AF23B97ECD5FCD314FBAE52E',
  // tx_json:
  //  { Account: 'rLRt8bmZFBEeM5VMSxZy15k8KKJEs68W6C',
  //    Fee: '12',
  //    Sequence: 4,
  //    SigningPubKey:
  //     '02E1EA8199F570E7F997A7B34EDFDA0A7D8B38173A17450B121A2EB048FDD16CA9',
  //    TransactionType: 'DepositPreauth',
  //    TxnSignature:
  //     '304402201F0EF6A2DE7F96966F7082294D14F3EC1EF59C21E29443E5858A0120079357A302203CDB7FEBDEAAD93FF39CB589B55778CB80DC3979F96F27E828D5E659BEB26B7A',
  //    hash:
  //     'C181D470684311658852713DA81F8201062535C8DE2FF853F7DD9981BB85312F' } })]
  'prepares tx when a required field is missing': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const txJSON = {
      Account: address,
      TransactionType: 'DepositPreauth'
      // Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo' // Normally required, intentionally removed
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON: `{"TransactionType":"DepositPreauth","Account":"${address}","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":23}`,
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'DepositPreauth - Authorize': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Authorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }
    const expected = {
      txJSON:
        '{"TransactionType":"DepositPreauth","Account":"' +
        address +
        '","Authorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":23}',
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    return assertResultMatch(response, expected, 'prepare')
  },

  'DepositPreauth - Unauthorize': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }

    const txJSON = {
      TransactionType: 'DepositPreauth',
      Account: address,
      Unauthorize: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON:
        '{"TransactionType":"DepositPreauth","Account":"' +
        address +
        '","Unauthorize":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":23}',
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  'AccountDelete': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '5.0' // 5 XRP fee for AccountDelete
    }

    const txJSON = {
      TransactionType: 'AccountDelete',
      Account: address,
      Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    const expected = {
      txJSON:
        '{"TransactionType":"AccountDelete","Account":"' +
        address +
        '","Destination":"rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe","Flags":2147483648,"LastLedgerSequence":8820051,"Fee":"12","Sequence":23}',
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    return assertResultMatch(response, expected, 'prepare')
  },

  // prepareTransaction - Payment
  'Payment - normal': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }

    const txJSON = {
      TransactionType: 'Payment',
      Account: address,
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: {
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM',
        value: '0.01'
      },
      SendMax: {
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM',
        value: '0.01'
      },
      Flags: 0
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(response, responses.preparePayment.normal, 'prepare')
  },

  'min amount xrp': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }

    const txJSON = {
      TransactionType: 'Payment',
      Account: address,
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',

      // Max amount to send. Use 100 billion XRP to
      // ensure that we send the full SendMax amount.
      Amount: '100000000000000000',

      SendMax: {
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM',
        value: '0.01'
      },
      DeliverMin: '10000',
      Flags: api.txFlags.Payment.PartialPayment
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(
      response,
      responses.preparePayment.minAmountXRP,
      'prepare'
    )
  },

  'min amount xrp2xrp': async (api, address) => {
    const txJSON = {
      TransactionType: 'Payment',
      Account: address,
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '10000',
      Flags: 0
    }
    const response = await api.prepareTransaction(
      txJSON,
      instructionsWithMaxLedgerVersionOffset
    )

    assertResultMatch(
      response,
      responses.preparePayment.minAmountXRPXRP,
      'prepare'
    )
  },

  'with all options specified': async (api, address) => {
    const ver = await api.getLedgerVersion()
    const localInstructions = {
      maxLedgerVersion: ver + 100,
      fee: '0.000012'
    }
    const txJSON = {
      TransactionType: 'Payment',
      Account: address,
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: '10000',
      InvoiceID:
        'A98FD36C17BE2B8511AD36DC335478E7E89F06262949F36EB88E2D683BBCC50A',
      SourceTag: 14,
      DestinationTag: 58,
      Memos: [
        {
          Memo: {
            MemoType: api.convertStringToHex('test'),
            MemoFormat: api.convertStringToHex('text/plain'),
            MemoData: api.convertStringToHex('texted data')
          }
        }
      ],
      Flags:
        0 |
        api.txFlags.Payment.NoRippleDirect |
        api.txFlags.Payment.LimitQuality
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(response, responses.preparePayment.allOptions, 'prepare')
  },

  'fee is capped at default maxFee of 2 XRP (using txJSON.LastLedgerSequence)': async (
    api,
    address
  ) => {
    api._feeCushion = 1000000

    const txJSON = {
      Flags: 2147483648,
      TransactionType: 'Payment',
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      },
      SendMax: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      },
      LastLedgerSequence: 8820051
    }
    const localInstructions = {}
    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
      instructions: {
        fee: '2',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee is capped at default maxFee of 2 XRP (using instructions.maxLedgerVersion)': async (
    api,
    address
  ) => {
    api._feeCushion = 1000000

    const txJSON = {
      Flags: 2147483648,
      TransactionType: 'Payment',
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      },
      SendMax: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      }
    }

    const localInstructions = {
      maxLedgerVersion: 8820051
    }

    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
      instructions: {
        fee: '2',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  // prepareTransaction - Payment
  'fee is capped to custom maxFeeXRP when maxFee exceeds maxFeeXRP': async (
    api,
    address
  ) => {
    api._feeCushion = 1000000
    api._maxFeeXRP = '3'
    const localInstructions = {
      maxFee: '4' // We are testing that this does not matter; fee is still capped to maxFeeXRP
    }

    const txJSON = {
      Flags: 2147483648,
      TransactionType: 'Payment',
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      },
      SendMax: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      },
      LastLedgerSequence: 8820051
    }

    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"3000000","Sequence":23}',
      instructions: {
        fee: '3',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  // prepareTransaction - Payment
  'fee is capped to maxFee': async (api, address) => {
    api._feeCushion = 1000000
    api._maxFeeXRP = '5'
    const localInstructions = {
      maxFee: '4' // maxFeeXRP does not matter if maxFee is lower than maxFeeXRP
    }

    const txJSON = {
      Flags: 2147483648,
      TransactionType: 'Payment',
      Account: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
      Destination: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
      Amount: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      },
      SendMax: {
        value: '0.01',
        currency: 'USD',
        issuer: 'rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM'
      },
      LastLedgerSequence: 8820051
    }

    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"4000000","Sequence":23}',
      instructions: {
        fee: '4',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee - calculated fee does not use more than 6 decimal places': async (
    api,
    address
  ) => {
    api.connection._send(
      JSON.stringify({
        command: 'config',
        data: {loadFactor: 5407.96875}
      })
    )

    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"64896","Sequence":23}',
      instructions: {
        fee: '0.064896',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }

    const response = await api.preparePayment(
      address,
      requests.preparePayment.normal,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'PaymentChannelCreate': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await api.prepareTransaction(
      {
        Account: address,
        TransactionType: 'PaymentChannelCreate',
        Amount: '1000000', // 1 XRP in drops. Use a string-encoded integer.
        Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
        SettleDelay: 86400,
        PublicKey:
          '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A'
        // If cancelAfter is used, you must use RippleTime.
        // You can use `iso8601ToRippleTime()` to convert to RippleTime.

        // Other fields are available (but not used in this test),
        // including `sourceTag` and `destinationTag`.
      },
      localInstructions
    )
    assertResultMatch(
      response,
      responses.preparePaymentChannelCreate.normal,
      'prepare'
    )
  },

  'PaymentChannelCreate full': async (api, address) => {
    const txJSON = {
      Account: address,
      TransactionType: 'PaymentChannelCreate',
      Amount: api.xrpToDrops('1'), // or '1000000'
      Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      SettleDelay: 86400,
      // Ensure this is in upper case if it is not already
      PublicKey: '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A'.toUpperCase(),
      CancelAfter: api.iso8601ToRippleTime('2017-02-17T15:04:57Z'),
      SourceTag: 11747,
      DestinationTag: 23480
    }

    const response = await api.prepareTransaction(txJSON)
    assertResultMatch(
      response,
      responses.preparePaymentChannelCreate.full,
      'prepare'
    )
  },

  'PaymentChannelFund': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const txJSON = {
      Account: address,
      TransactionType: 'PaymentChannelFund',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Amount: api.xrpToDrops('1') // or '1000000'
    }
    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(
      response,
      responses.preparePaymentChannelFund.normal,
      'prepare'
    )
  },

  'PaymentChannelFund full': async (api, address) => {
    const txJSON = {
      Account: address,
      TransactionType: 'PaymentChannelFund',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Amount: api.xrpToDrops('1'), // or '1000000'
      Expiration: api.iso8601ToRippleTime('2017-02-17T15:04:57Z')
    }

    const response = await api.prepareTransaction(txJSON)
    assertResultMatch(
      response,
      responses.preparePaymentChannelFund.full,
      'prepare'
    )
  },

  'PaymentChannelClaim': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }

    const txJSON = {
      Account: address,
      TransactionType: 'PaymentChannelClaim',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Flags: 0
    }

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(
      response,
      responses.preparePaymentChannelClaim.normal,
      'prepare'
    )
  },

  'PaymentChannelClaim with renew': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }

    const txJSON = {
      Account: address,
      TransactionType: 'PaymentChannelClaim',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Balance: api.xrpToDrops('1'), // or '1000000'
      Amount: api.xrpToDrops('1'), // or '1000000'
      Signature:
        '30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1E721B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80ECA3CD7B9B',
      PublicKey:
        '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
      Flags: 0
    }
    txJSON.Flags |= api.txFlags.PaymentChannelClaim.Renew

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(
      response,
      responses.preparePaymentChannelClaim.renew,
      'prepare'
    )
  },

  'PaymentChannelClaim with close': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }

    const txJSON = {
      Account: address,
      TransactionType: 'PaymentChannelClaim',
      Channel:
        'C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198',
      Balance: api.xrpToDrops('1'), // or 1000000
      Amount: api.xrpToDrops('1'), // or 1000000
      Signature:
        '30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1E721B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80ECA3CD7B9B',
      PublicKey:
        '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
      Flags: 0
    }
    txJSON.Flags |= api.txFlags.PaymentChannelClaim.Close

    const response = await api.prepareTransaction(txJSON, localInstructions)
    assertResultMatch(
      response,
      responses.preparePaymentChannelClaim.close,
      'prepare'
    )
  }
}
