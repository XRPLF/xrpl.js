import net from 'net'

import { assert } from 'chai'
import _ from 'lodash'

import addresses from './fixtures/addresses.json'

/**
 * Setup to run tests on both classic addresses and X-addresses.
 */
export const addressTests = [
  { type: 'Classic Address', address: addresses.ACCOUNT },
  { type: 'X-Address', address: addresses.ACCOUNT_X },
]

/**
 * Check the response against the expected result. Optionally validate
 * that response against a given schema as well.
 *
 * @param response - Response received from the method.
 * @param expected - Expected response from the method.
 * @param schemaName - Name of the schema used to validate the shape of the response.
 */
export function assertResultMatch(
  response: any,
  expected: any,
  schemaName?: string,
) {
  if (expected.txJSON) {
    assert(response.txJSON)
    assert.deepEqual(
      JSON.parse(response.txJSON),
      JSON.parse(expected.txJSON),
      'checkResult: txJSON must match',
    )
  }
  if (expected.tx_json) {
    assert(response.tx_json)
    assert.deepEqual(
      response.tx_json,
      expected.tx_json,
      'checkResult: tx_json must match',
    )
  }
  assert.deepEqual(
    _.omit(response, ['txJSON', 'tx_json']),
    _.omit(expected, ['txJSON', 'tx_json']),
  )
}

/**
 * Check that the promise rejects with an expected error.
 *
 * @param promise - The promise returned by the method.
 * @param instanceOf - Expected error type that the method will throw.
 * @param message - Expected error message/substring of the error message.
 */
export async function assertRejects(
  promise: PromiseLike<any>,
  instanceOf: any,
  message?: string | RegExp,
) {
  try {
    await promise
    assert(false, 'Expected an error to be thrown')
  } catch (error) {
    assert(error instanceof instanceOf, error.message)
    if (typeof message === 'string') {
      assert.strictEqual(error.message, message)
    } else if (message instanceof RegExp) {
      assert(message.test(error.message))
    }
  }
}

// using a free port instead of a constant port enables parallelization
export async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    let port
    server.on('listening', function () {
      port = (server.address() as any).port
      server.close()
    })
    server.on('close', function () {
      resolve(port)
    })
    server.on('error', function (error) {
      reject(error)
    })
    server.listen(0)
  })
}

/**
 * Ignore WebSocket DisconnectErrors. Useful for making requests where we don't
 * care about the response and plan to teardown the test before the response
 * has come back.
 *
 * @param error - Thrown error.
 */
export function ignoreWebSocketDisconnect(error: Error): void {
  if (error.message === 'websocket was closed') {
    return
  }
  throw error
}
