import { assert } from 'chai'

import ECDSA from '../../src/common/ecdsa'
import { UnexpectedError } from '../../src/common/errors'
import {
  generateXAddress,
  GenerateAddressOptions,
} from '../../src/utils/generateAddress'
import responses from '../fixtures/responses'

describe('generateAddress', function () {
  it('generateAddress', function () {
    assert.deepEqual(
      // GIVEN entropy of all zeros
      // WHEN generating an address
      generateXAddress({ entropy: new Array(16).fill(0) }),

      // THEN we get the expected return value
      responses.generateXAddress,
    )
  })

  it('generateAddress invalid entropy', function () {
    assert.throws(() => {
      // GIVEN entropy of 1 byte
      // WHEN generating an address
      generateXAddress({ entropy: new Array(1).fill(0) })

      // THEN an UnexpectedError is thrown
      // because 16 bytes of entropy are required
    }, UnexpectedError)
  })

  it('generateAddress with no options object', function () {
    // GIVEN no options

    // WHEN generating an address
    const account = generateXAddress()

    // THEN we get an object with an xAddress starting with 'x' and a secret starting with 's'
    assert(account.xAddress.startsWith('X'), 'Address must start with `X`')
    assert(account.secret.startsWith('s'), 'Secret must start with `s`')
  })

  it('generateAddress with empty options object', function () {
    // GIVEN an empty options object
    const options = {}

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get an object with an xAddress starting with 'x' and a secret starting with 's'
    assert(account.xAddress.startsWith('X'), 'Address must start with `X`')
    assert(account.secret.startsWith('s'), 'Secret must start with `s`')
  })

  it('generateAddress with algorithm `ecdsa-secp256k1`', function () {
    // GIVEN we want to use 'ecdsa-secp256k1'
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      includeClassicAddress: true,
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get an object with an address starting with 'r' and a secret starting with 's' (not 'sEd')
    assert(
      account.classicAddress?.startsWith('r'),
      'Address must start with `r`',
    )
    assert.deepEqual(
      account.secret.slice(0, 1),
      's',
      `Secret ${account.secret} must start with 's'`,
    )
    assert.notStrictEqual(
      account.secret.slice(0, 3),
      'sEd',
      `secp256k1 secret ${account.secret} must not start with 'sEd'`,
    )
  })

  it('generateAddress with algorithm `ed25519`', function () {
    // GIVEN we want to use 'ed25519'
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      includeClassicAddress: true,
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get an object with an address starting with 'r' and a secret starting with 'sEd'
    assert(
      account.classicAddress?.startsWith('r'),
      'Address must start with `r`',
    )
    assert.deepEqual(
      account.secret.slice(0, 3),
      'sEd',
      `Ed25519 secret ${account.secret} must start with 'sEd'`,
    )
  })

  it('generateAddress with algorithm `ecdsa-secp256k1` and given entropy', function () {
    // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0),
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, responses.generateXAddress)
  })

  it('generateAddress with algorithm `ed25519` and given entropy', function () {
    // GIVEN we want to use 'ed25519' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0),
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, {
      // generateAddress return value always includes xAddress to encourage X-address adoption
      xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',
      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
    })
  })

  it('generateAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address', function () {
    // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true,
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, responses.generateAddress)
  })

  it('generateAddress with algorithm `ed25519` and given entropy; include classic address', function () {
    // GIVEN we want to use 'ed25519' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true,
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, {
      // generateAddress return value always includes xAddress to encourage X-address adoption
      xAddress: 'X7xq1YJ4xmLSGGLhuakFQB9CebWYthQkgsvFC4LGFH871HB',

      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
      classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
      address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
    })
  })

  it('generateAddress with algorithm `ecdsa-secp256k1` and given entropy; include classic address; for test network use', function () {
    // GIVEN we want to use 'ecdsa-secp256k1' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.secp256k1,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true,
      test: true,
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get the expected return value
    const response = {
      // generateAddress return value always includes xAddress to encourage X-address adoption
      ...responses.generateAddress,
      xAddress: 'TVG3TcCD58BD6MZqsNuTihdrhZwR8SzvYS8U87zvHsAcNw4',
    }
    assert.deepEqual(account, response)
  })

  it('generateAddress with algorithm `ed25519` and given entropy; include classic address; for test network use', function () {
    // GIVEN we want to use 'ed25519' with entropy of zero
    const options: GenerateAddressOptions = {
      algorithm: ECDSA.ed25519,
      entropy: new Array(16).fill(0),
      includeClassicAddress: true,
      test: true,
    }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get the expected return value
    assert.deepEqual(account, {
      // generateAddress return value always includes xAddress to encourage X-address adoption
      xAddress: 'T7t4HeTMF5tT68agwuVbJwu23ssMPeh8dDtGysZoQiij1oo',
      secret: 'sEdSJHS4oiAdz7w2X2ni1gFiqtbJHqE',
      classicAddress: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
      address: 'r9zRhGr7b6xPekLvT6wP4qNdWMryaumZS7',
    })
  })

  it('generateAddress for test network use', function () {
    // GIVEN we want an address for test network use
    const options: GenerateAddressOptions = { test: true }

    // WHEN generating an address
    const account = generateXAddress(options)

    // THEN we get an object with xAddress starting with 'T' and a secret starting with 's'

    // generateAddress return value always includes xAddress to encourage X-address adoption
    assert.deepEqual(
      account.xAddress.slice(0, 1),
      'T',
      'Test addresses start with T',
    )

    assert.deepEqual(
      account.secret.slice(0, 1),
      's',
      `Secret ${account.secret} must start with 's'`,
    )
  })
})
