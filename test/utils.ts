import net from 'net'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import {Client} from 'xrpl-local'
import assert from 'assert-diff'

/**
 * The test function. It takes a Client object and then some other data to
 * test (currently: an address). May be called multiple times with different
 * arguments, to test different types of data.
 */
export type TestFn = (
  client: Client,
  address: string,
  mockRippled?: any
) => void | PromiseLike<void>

/**
 * A suite of tests to run. Maps the test name to the test function.
 */
export interface TestSuite {
  [testName: string]: TestFn
}

/**
 * When the test suite is loaded, we represent it with the following
 * data structure containing tests and metadata about the suite.
 * If no test suite exists, we return this object with `isMissing: true`
 * so that we can report it.
 */
interface LoadedTestSuite {
  name: string
  tests: [string, TestFn][]
  config: {
    /** Set to true to skip re-running tests with an X-address. */
    skipXAddress?: boolean
  }
}

/**
 * Check the response against the expected result. Optionally validate
 * that response against a given schema as well.
 */
export function assertResultMatch(
  response: any,
  expected: any,
  schemaName?: string
) {
  if (expected.txJSON) {
    assert(response.txJSON)
    assert.deepEqual(
      JSON.parse(response.txJSON),
      JSON.parse(expected.txJSON),
      'checkResult: txJSON must match'
    )
  }
  if (expected.tx_json) {
    assert(response.tx_json)
    assert.deepEqual(
      response.tx_json,
      expected.tx_json,
      'checkResult: tx_json must match'
    )
  }
  assert.deepEqual(
    _.omit(response, ['txJSON', 'tx_json']),
    _.omit(expected, ['txJSON', 'tx_json'])
  )
}

/**
 * Check that the promise rejects with an expected error.
 */
export async function assertRejects(
  promise: PromiseLike<any>,
  instanceOf: any,
  message?: string | RegExp
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
export function getFreePort() {
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

export function getAllPublicMethods(client: Client) {
  return Array.from(
    new Set([
      ...Object.getOwnPropertyNames(client),
      ...Object.getOwnPropertyNames(Client.prototype)
    ])
  ).filter((key) => !key.startsWith('_'))
}

export function loadTestSuites(): LoadedTestSuite[] {
  const allTests = fs.readdirSync(path.join(__dirname, 'client'), {
    encoding: 'utf8'
  })
  return allTests
    .map((methodName) => {
      if (methodName.startsWith('.DS_Store')) {
        return null
      }
      const testSuite = require(`./client/${methodName}`)
      return {
        name: methodName,
        config: testSuite.config || {},
        tests: Object.entries(testSuite.default || {})
      } as LoadedTestSuite
    })
    .filter(Boolean)
}

/**
 * Ignore WebSocket DisconnectErrors. Useful for making requests where we don't
 * care about the response and plan to teardown the test before the response
 * has come back.
 */
export function ignoreWebSocketDisconnect(error: Error): void {
  if (error.message === 'websocket was closed') {
    return
  }
  throw error
}
