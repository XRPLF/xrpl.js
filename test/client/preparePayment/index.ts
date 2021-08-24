import {assertResultMatch, TestSuite, assertRejects} from '../../utils'
import responses from '../../fixtures/responses'
import rippled from '../../fixtures/rippled'
import requests from '../../fixtures/requests'
import {ValidationError} from 'xrpl-local/common/errors'
import binary from 'ripple-binary-codec'
import assert from 'assert-diff'
import {Client} from 'xrpl-local'

const {schemaValidator} = Client._PRIVATE
const instructionsWithMaxLedgerVersionOffset = {maxLedgerVersionOffset: 100}
const {preparePayment: REQUEST_FIXTURES} = requests
const {preparePayment: RESPONSE_FIXTURES} = responses
const RECIPIENT_ADDRESS = 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'normal': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await client.preparePayment(
      address,
      REQUEST_FIXTURES.normal,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.normal, 'prepare')
  },

  'min amount xrp': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await client.preparePayment(
      address,
      REQUEST_FIXTURES.minAmountXRP,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.minAmountXRP, 'prepare')
  },

  'min amount xrp2xrp': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const response = await client.preparePayment(
      address,
      REQUEST_FIXTURES.minAmount,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, RESPONSE_FIXTURES.minAmountXRPXRP, 'prepare')
  },

  'XRP to XRP': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: {value: '1', currency: 'XRP'}
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: {value: '1', currency: 'XRP'}
      }
    }
    const expected = {
      txJSON:
        '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await client.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  'XRP drops to XRP drops': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: {value: '1000000', currency: 'drops'}
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: {value: '1000000', currency: 'drops'}
      }
    }
    const expected = {
      txJSON:
        '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await client.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  'XRP drops to XRP': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: {value: '1000000', currency: 'drops'}
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: {value: '1', currency: 'XRP'}
      }
    }
    const expected = {
      txJSON:
        '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await client.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  'XRP to XRP drops': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: {value: '1', currency: 'XRP'}
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: {value: '1000000', currency: 'drops'}
      }
    }
    const expected = {
      txJSON:
        '{"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":"1000000","Flags":2147483648,"LastLedgerSequence":8820051,"Sequence":23,"Fee":"12"}',
      instructions: {
        fee: '0.000012',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await client.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  // Errors
  'rejects promise and does not throw when payment object is invalid': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const payment = {
      source: {
        address: address,
        // instead of `maxAmount`
        amount: {value: '1000', currency: 'drops'}
      },
      destination: {
        address: RECIPIENT_ADDRESS,
        amount: {value: '1000', currency: 'drops'}
      }
    }

    return assertRejects(
      client.preparePayment(address, payment),
      ValidationError,
      'payment must specify either (source.maxAmount and destination.amount) or (source.amount and destination.minAmount)'
    )
  },

  'rejects promise and does not throw when field is missing': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    // Marking as "any" to get around the fact that TS won't allow this.
    const payment: any = {
      source: {address: address},
      destination: {
        address: RECIPIENT_ADDRESS,
        amount: {value: '1000', currency: 'drops'}
      }
    }

    return assertRejects(
      client.preparePayment(address, payment),
      ValidationError,
      'instance.payment.source is not exactly one from <sourceExactAdjustment>,<maxAdjustment>'
    )
  },

  'rejects promise and does not throw when fee exceeds maxFeeXRP': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const payment = {
      source: {
        address: address,
        maxAmount: {value: '1000', currency: 'drops'}
      },
      destination: {
        address: RECIPIENT_ADDRESS,
        amount: {value: '1000', currency: 'drops'}
      }
    }
    return assertRejects(
      client.preparePayment(address, payment, {fee: '3'}),
      ValidationError,
      'Fee of 3 XRP exceeds max of 2 XRP. To use this fee, increase `maxFeeXRP` in the Client constructor.'
    )
  },

  'XRP to XRP no partial': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    return assertRejects(
      client.preparePayment(address, REQUEST_FIXTURES.wrongPartial),
      ValidationError,
      'XRP to XRP payments cannot be partial payments'
    )
  },

  'address must match payment.source.address': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    return assertRejects(
      client.preparePayment(address, REQUEST_FIXTURES.wrongAddress),
      ValidationError,
      'address must match payment.source.address'
    )
  },

  'wrong amount': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    return assertRejects(
      client.preparePayment(address, REQUEST_FIXTURES.wrongAmount),
      ValidationError,
      'payment must specify either (source.maxAmount and destination.amount) or (source.amount and destination.minAmount)'
    )
  },

  'throws when fee exceeds 2 XRP': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      fee: '2.1'
    }
    return assertRejects(
      client.preparePayment(address, REQUEST_FIXTURES.normal, localInstructions),
      ValidationError,
      'Fee of 2.1 XRP exceeds max of 2 XRP. To use this fee, increase `maxFeeXRP` in the Client constructor.'
    )
  },

  // 'preparePayment with all options specified': async (client, address) => {
  //   const ledgerResponse = await client.request({command: 'ledger', ledger_index: 'validated'})
  //   const version = ledgerResponse.result.ledger_index
  //   const localInstructions = {
  //     maxLedgerVersion: version + 100,
  //     fee: '0.000012'
  //   }
  //   const response = await client.preparePayment(
  //     address,
  //     REQUEST_FIXTURES.allOptions,
  //     localInstructions
  //   )
  //   assertResultMatch(response, RESPONSE_FIXTURES.allOptions, 'prepare')
  // },

  'preparePayment without counterparty set': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      sequence: 23
    }
    const response = await client.preparePayment(
      address,
      REQUEST_FIXTURES.noCounterparty,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.noCounterparty, 'prepare')
  },

  'preparePayment with source.amount/destination.minAmount can be signed': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    // See also: 'sign succeeds with source.amount/destination.minAmount'

    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      sequence: 23
    }
    const response = await client.preparePayment(
      address,
      {
        source: {
          address,
          amount: {
            currency: 'GBP',
            value: '0.1',
            counterparty: 'rpat5TmYjDsnFSStmgTumFgXCM9eqsWPro'
          }
        },
        destination: {
          address: 'rEX4LtGJubaUcMWCJULcy4NVxGT9ZEMVRq',
          minAmount: {
            currency: 'USD',
            value: '0.1248548562296331',
            counterparty: 'rMaa8VLBTjwTJWA2kSme4Sqgphhr6Lr6FH'
          }
        }
      },
      localInstructions
    )

    // Important: check that the prepared transaction can actually be signed
    // https://github.com/ripple/ripple-lib/issues/1237#issuecomment-631670946

    const secret = 'shotKgaEotpcYsshSE39vmSnBDRim'
    const result = client.sign(response.txJSON, secret)
    const expectedResult = {
      signedTransaction:
        '12000022800200002400000017201B0086955361EC6386F26FC0FFFF0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A68400000000000000C69D4438D7EA4C6800000000000000000000000000047425000000000000C155FFE99C8C91F67083CEFFDB69EBFE76348CA6AD4446F8C5D8A5E0B0000000000000000000000005553440000000000DC596C88BCDE4E818D416FCDEEBF2C8656BADC9A7321022B05847086686F9D0499B13136B94AD4323EE1B67D4C429ECC987AB35ACFA34574473045022100D9634523D8E232D4A7807A71856023D82AC928FA29848571B820867898413B5F022041AC00EC1F81A26A6504EBF844A38CC3204694EF2CC1A97A87632721631F93DA81145E7B112523F68D2F5E879DB4EAC51C6698A6930483149F500E50C2F016CA01945E5A1E5846B61EF2D376',
      id: '1C558AA9B926C24FB6BBD6950B2DB1350A83F9F12E4385208867907019761A2D'
    }
    const decoded = binary.decode(result.signedTransaction)
    assert(
      decoded.Flags === 2147614720,
      `Flags = ${decoded.Flags}, should be 2147614720`
    )
    assert.deepEqual(result, expectedResult)
    schemaValidator.schemaValidate('sign', result)
  },

  'destination.minAmount': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    const response = await client.preparePayment(
      address,
      responses.getPaths.sendAll[0],
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, RESPONSE_FIXTURES.minAmount, 'prepare')
  },

  'caps fee at 2 XRP by default': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    client._feeCushion = 1000000
    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
      instructions: {
        fee: '2',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await client.preparePayment(
      address,
      REQUEST_FIXTURES.normal,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'allows fee exceeding 2 XRP when maxFeeXRP is higher': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    client._maxFeeXRP = '2.2'
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      fee: '2.1'
    }
    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2100000","Sequence":23}',
      instructions: {
        fee: '2.1',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await client.preparePayment(
      address,
      REQUEST_FIXTURES.normal,
      localInstructions
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee - default maxFee of 2 XRP': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    client._feeCushion = 1000000
    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
      instructions: {
        fee: '2',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await client.preparePayment(
      address,
      requests.preparePayment.normal,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee - capped to maxFeeXRP when maxFee exceeds maxFeeXRP': async (
    client,
    address,
    mockRippled
  ) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    client._feeCushion = 1000000
    client._maxFeeXRP = '3'
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '4'
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
    const response = await client.preparePayment(
      address,
      requests.preparePayment.normal,
      localInstructions
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee - capped to maxFee': async (client, address, mockRippled) => {
    mockRippled.addResponse({command: 'server_info'}, rippled.server_info.normal)
    client._feeCushion = 1000000
    client._maxFeeXRP = '5'
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '4'
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
    const response = await client.preparePayment(
      address,
      requests.preparePayment.normal,
      localInstructions
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  // 'fee - calculated fee does not use more than 6 decimal places': async (
  //   client,
  //   address
  // ) => {
  //   client.connection.request({
  //     command: 'config',
  //     data: {loadFactor: 5407.96875}
  //   })
  //   const expectedResponse = {
  //     txJSON:
  //       '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"64896","Sequence":23}',
  //     instructions: {
  //       fee: '0.064896',
  //       sequence: 23,
  //       maxLedgerVersion: 8820051
  //     }
  //   }
  //   const response = await client.preparePayment(
  //     address,
  //     requests.preparePayment.normal,
  //     instructionsWithMaxLedgerVersionOffset
  //   )
  //   assertResultMatch(response, expectedResponse, 'prepare')
  // },

  // Tickets
  // 'preparePayment with ticketSequence': async (client, address) => {
  //   const ledgerResponse = await client.request({
  //     command: 'ledger', 
  //     ledger_index: 'validated'
  //   })
  //   const version = ledgerResponse.result.ledger_index
  //   const localInstructions = {
  //     maxLedgerVersion: version + 100,
  //     fee: '0.000012',
  //     ticketSequence: 23
  //   }
  //   const response = await client.preparePayment(
  //     address,
  //     REQUEST_FIXTURES.allOptions,
  //     localInstructions
  //   )
  //   assertResultMatch(response, RESPONSE_FIXTURES.ticketSequence, 'prepare')
  // },

  // 'throws when both sequence and ticketSequence are set': async (
  //   client,
  //   address
  // ) => {
  //   const ledgerResponse = await client.request({
  //     command: 'ledger', 
  //     ledger_index: 'validated'
  //   })
  //   const version = ledgerResponse.result.ledger_index
  //   const localInstructions = {
  //     maxLedgerVersion: version + 100,
  //     fee: '0.000012',
  //     ticketSequence: 23,
  //     sequence: 12
  //   }
  //   return assertRejects(
  //     client.preparePayment(
  //       address,
  //       REQUEST_FIXTURES.allOptions,
  //       localInstructions
  //     ),
  //     ValidationError,
  //     'instance.instructions is of prohibited type [object Object]'
  //   )
  // }
}
