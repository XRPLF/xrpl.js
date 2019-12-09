import { assertResultMatch, TestSuite, assertRejects } from '../../utils'
import responses from '../../fixtures/responses'
import requests from '../../fixtures/requests'
import { ValidationError } from 'ripple-api/common/errors'
const instructionsWithMaxLedgerVersionOffset = { maxLedgerVersionOffset: 100 }
const { preparePayment: REQUEST_FIXTURES } = requests
const { preparePayment: RESPONSE_FIXTURES } = responses
const RECIPIENT_ADDRESS = 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'normal': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await api.preparePayment(
      address,
      REQUEST_FIXTURES.normal,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.normal, 'prepare')
  },

  'min amount xrp': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      maxFee: '0.000012'
    }
    const response = await api.preparePayment(
      address,
      REQUEST_FIXTURES.minAmountXRP,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.minAmountXRP, 'prepare')
  },

  'min amount xrp2xrp': async (api, address) => {
    const response = await api.preparePayment(
      address,
      REQUEST_FIXTURES.minAmount,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, RESPONSE_FIXTURES.minAmountXRPXRP, 'prepare')
  },

  'XRP to XRP': async (api, address) => {
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: { value: '1', currency: 'XRP' }
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: { value: '1', currency: 'XRP' }
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
    const response = await api.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  'XRP drops to XRP drops': async (api, address) => {
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: { value: '1000000', currency: 'drops' }
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: { value: '1000000', currency: 'drops' }
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
    const response = await api.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  'XRP drops to XRP': async (api, address) => {
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: { value: '1000000', currency: 'drops' }
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: { value: '1', currency: 'XRP' }
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
    const response = await api.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  'XRP to XRP drops': async (api, address) => {
    const payment = {
      source: {
        address: 'r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59',
        maxAmount: { value: '1', currency: 'XRP' }
      },
      destination: {
        address: 'rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo',
        amount: { value: '1000000', currency: 'drops' }
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
    const response = await api.preparePayment(
      address,
      payment,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expected, 'prepare')
  },

  // Errors
  'rejects promise and does not throw when payment object is invalid': async (
    api,
    address
  ) => {
    const payment = {
      source: {
        address: address,
        // instead of `maxAmount`
        amount: { value: '1000', currency: 'drops' }
      },
      destination: {
        address: RECIPIENT_ADDRESS,
        amount: { value: '1000', currency: 'drops' }
      }
    }

    return assertRejects(
      api.preparePayment(address, payment),
      ValidationError,
      'payment must specify either (source.maxAmount and destination.amount) or (source.amount and destination.minAmount)'
    )
  },

  'rejects promise and does not throw when field is missing': async (
    api,
    address
  ) => {
    // Marking as "any" to get around the fact that TS won't allow this.
    const payment: any = {
      source: { address: address },
      destination: {
        address: RECIPIENT_ADDRESS,
        amount: { value: '1000', currency: 'drops' }
      }
    }

    return assertRejects(
      api.preparePayment(address, payment),
      ValidationError,
      'instance.payment.source is not exactly one from <sourceExactAdjustment>,<maxAdjustment>'
    )
  },

  'rejects promise and does not throw when fee exceeds maxFeeXRP': async (
    api,
    address
  ) => {
    const payment = {
      source: {
        address: address,
        maxAmount: { value: '1000', currency: 'drops' }
      },
      destination: {
        address: RECIPIENT_ADDRESS,
        amount: { value: '1000', currency: 'drops' }
      }
    }
    return assertRejects(
      api.preparePayment(address, payment, { fee: '3' }),
      ValidationError,
      'Fee of 3 XRP exceeds max of 2 XRP. To use this fee, increase `maxFeeXRP` in the RippleAPI constructor.'
    )
  },

  'XRP to XRP no partial': async (api, address) => {
    return assertRejects(
      api.preparePayment(address, REQUEST_FIXTURES.wrongPartial),
      ValidationError,
      'XRP to XRP payments cannot be partial payments'
    )
  },

  'address must match payment.source.address': async (api, address) => {
    return assertRejects(
      api.preparePayment(address, REQUEST_FIXTURES.wrongAddress),
      ValidationError,
      'address must match payment.source.address'
    )
  },

  'wrong amount': async (api, address) => {
    return assertRejects(
      api.preparePayment(address, REQUEST_FIXTURES.wrongAmount),
      ValidationError,
      'payment must specify either (source.maxAmount and destination.amount) or (source.amount and destination.minAmount)'
    )
  },

  'throws when fee exceeds 2 XRP': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      fee: '2.1'
    }
    return assertRejects(
      api.preparePayment(address, REQUEST_FIXTURES.normal, localInstructions),
      ValidationError,
      'Fee of 2.1 XRP exceeds max of 2 XRP. To use this fee, increase `maxFeeXRP` in the RippleAPI constructor.'
    )
  },

  'preparePayment with all options specified': async (api, address) => {
    const version = await api.getLedgerVersion()
    const localInstructions = {
      maxLedgerVersion: version + 100,
      fee: '0.000012'
    }
    const response = await api.preparePayment(
      address,
      REQUEST_FIXTURES.allOptions,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.allOptions, 'prepare')
  },

  'preparePayment without counterparty set': async (api, address) => {
    const localInstructions = {
      ...instructionsWithMaxLedgerVersionOffset,
      sequence: 23
    }
    const response = await api.preparePayment(
      address,
      REQUEST_FIXTURES.noCounterparty,
      localInstructions
    )
    assertResultMatch(response, RESPONSE_FIXTURES.noCounterparty, 'prepare')
  },

  'destination.minAmount': async (api, address) => {
    const response = await api.preparePayment(
      address,
      responses.getPaths.sendAll[0],
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, RESPONSE_FIXTURES.minAmount, 'prepare')
  },

  'caps fee at 2 XRP by default': async (api, address) => {
    api._feeCushion = 1000000
    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
      instructions: {
        fee: '2',
        sequence: 23,
        maxLedgerVersion: 8820051
      }
    }
    const response = await api.preparePayment(
      address,
      REQUEST_FIXTURES.normal,
      instructionsWithMaxLedgerVersionOffset
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'allows fee exceeding 2 XRP when maxFeeXRP is higher': async (
    api,
    address
  ) => {
    api._maxFeeXRP = '2.2'
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
    const response = await api.preparePayment(
      address,
      REQUEST_FIXTURES.normal,
      localInstructions
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee - default maxFee of 2 XRP': async (api, address) => {
    api._feeCushion = 1000000
    const expectedResponse = {
      txJSON:
        '{"Flags":2147483648,"TransactionType":"Payment","Account":"r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59","Destination":"rpZc4mVfWUif9CRoHRKKcmhu1nx2xktxBo","Amount":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"SendMax":{"value":"0.01","currency":"USD","issuer":"rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"},"LastLedgerSequence":8820051,"Fee":"2000000","Sequence":23}',
      instructions: {
        fee: '2',
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

  'fee - capped to maxFeeXRP when maxFee exceeds maxFeeXRP': async (
    api,
    address
  ) => {
    api._feeCushion = 1000000
    api._maxFeeXRP = '3'
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
    const response = await api.preparePayment(
      address,
      requests.preparePayment.normal,
      localInstructions
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee - capped to maxFee': async (api, address) => {
    api._feeCushion = 1000000
    api._maxFeeXRP = '5'
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
    const response = await api.preparePayment(
      address,
      requests.preparePayment.normal,
      localInstructions
    )
    assertResultMatch(response, expectedResponse, 'prepare')
  },

  'fee - calculated fee does not use more than 6 decimal places': async (
    api,
    address
  ) => {
    api.connection._send(
      JSON.stringify({
        command: 'config',
        data: { loadFactor: 5407.96875 }
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
  }
}
