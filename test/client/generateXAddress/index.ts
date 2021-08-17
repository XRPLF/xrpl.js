import assert from 'assert-diff'
import responses from '../../fixtures/responses'
import {TestSuite} from '../../utils'
import ECDSA from '../../../src/common/ecdsa'
import {GenerateAddressOptions} from '../../../src/offline/generate-address'

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'generateXAddress': async (client) => {
    // GIVEN entropy of all zeros
    function random() {
      return new Array(16).fill(0)
    }

    assert.deepEqual(
      // WHEN generating an X-address
      client.generateXAddress({entropy: random()}),

      // THEN we get the expected return value
      responses.generateXAddress
    )
  },

  'generateXAddress invalid entropy': async (client) => {
    assert.throws(() => {
      // GIVEN entropy of 1 byte
      function random() {
        return new Array(1).fill(0)
      }

      // WHEN generating an X-address
      client.generateXAddress({entropy: random()})

      // THEN an UnexpectedError is thrown
      // because 16 bytes of entropy are required
    }, client.errors.UnexpectedError)
  },

  'generateXAddress with no options object': async (client) => {
    // GIVEN no options

    // WHEN generating an X-address
    const account = client.generateXAddress()

    // THEN we get an object with an xAddress starting with 'X' and a secret starting with 's'
    assert(
      account.xAddress.startsWith('X'),
      'By default X-addresses start with X'
    )
    assert(account.secret.startsWith('s'), 'Secrets start with s')
  },

  'generateXAddress with empty options object': async (client) => {
    // GIVEN an empty options object
    const options = {}

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get an object with an xAddress starting with 'X' and a secret starting with 's'
    assert(
      account.xAddress.startsWith('X'),
      'By default X-addresses start with X'
    )
    assert(account.secret.startsWith('s'), 'Secrets start with s')
  },

  'generateXAddress with algorithm `ecdsa-secp256k1`': async (client) => {
    // GIVEN we want to use 'ecdsa-secp256k1'
    const options: GenerateAddressOptions = {algorithm: ECDSA.secp256k1}

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get an object with an xAddress starting with 'X' and a secret starting with 's'
    assert(
      account.xAddress.startsWith('X'),
      'By default X-addresses start with X'
    )
    assert.deepEqual(
      account.secret.slice(0, 1),
      's',
      `Secret ${account.secret} must start with 's'`
    )
    assert.notStrictEqual(
      account.secret.slice(0, 3),
      'sEd',
      `secp256k1 secret ${account.secret} must not start with 'sEd'`
    )
  },

  'generateXAddress with algorithm `ed25519`': async (client) => {
    // GIVEN we want to use 'ed25519'
    const options: GenerateAddressOptions = {algorithm: ECDSA.ed25519}

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get an object with an xAddress starting with 'X' and a secret starting with 'sEd'
    assert(
      account.xAddress.startsWith('X'),
      'By default X-addresses start with X'
    )
    assert.deepEqual(
      account.secret.slice(0, 3),
      'sEd',
      `Ed25519 secret ${account.secret} must start with 'sEd'`
    )
  },

  'generateXAddress with algorithm `ecdsa-secp256k1` and given entropy': async (
    client
  ) => {
    // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0)
    }

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, responses.generateXAddress)
  },

  'generateXAddress with algorithm `ed25519` and given entropy': async (
    client
  ) => {
    // GIVEN we want to use 'ed25519' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0)
    }

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, {
      xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',
      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE'
    })
  },

  'generateXAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address': async (
    client
  ) => {
    // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true
    }

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, responses.generateAddress)
  },

  'generateXAddress with algorithm `ed25519` and given entropy; include classic address': async (
    client
  ) => {
    // GIVEN we want to use 'ed25519' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true
    }

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, {
      xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',
      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
      classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
      address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7'
    })
  },

  'generateXAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address; for test network use': async (
    client
  ) => {
    // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true,
      test: true
    }

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get the expected return value
    const response = Object.assign({}, responses.generateAddress, {
      xAddress: 'TVG3TcCD58BD6MZqsNuTihdrhZwR8SzvYS8U87zvHsAcNw4'
    })
    assert.deepEqual(account, response)
  },

  'generateXAddress with algorithm `ed25519` and given entropy; include classic address; for test network use': async (
    client
  ) => {
    // GIVEN we want to use 'ed25519' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true,
      test: true
    }

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, {
      xAddress: 'T7t4HeTMF5tT68agwuVbJwu23ssMPeh8dDtGysZoQiij1oo',
      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
      classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
      address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7'
    })
  },

  'generateXAddress for test network use': async (client) => {
    // GIVEN we want an X-address for test network use
    const options: GenerateAddressOptions = {test: true}

    // WHEN generating an X-address
    const account = client.generateXAddress(options)

    // THEN we get an object with xAddress starting with 'T' and a secret starting with 's'
    assert.deepEqual(
      account.xAddress.slice(0, 1),
      'T',
      'Test X-addresses start with T'
    )
    assert.deepEqual(
      account.secret.slice(0, 1),
      's',
      `Secret ${account.secret} must start with 's'`
    )
  }
}
