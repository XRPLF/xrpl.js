/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any -- required for
assertions. */
import net from 'net'

import { assert } from 'chai'
import omit from 'lodash/omit'

import { rippleTimeToUnixTime, unixTimeToRippleTime } from '../src'

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
 * @param _schemaName - Name of the schema used to validate the shape of the response.
 */
export function assertResultMatch(
  response: any,
  expected: any,
  _schemaName?: string,
): void {
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
    omit(response, ['txJSON', 'tx_json']),
    omit(expected, ['txJSON', 'tx_json']),
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
  promise: PromiseLike<unknown>,
  instanceOf: any,
  message?: string | RegExp,
): Promise<void> {
  try {
    await promise
    assert(false, 'Expected an error to be thrown')
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error
    }

    assert(error instanceof instanceOf, error.message)
    if (typeof message === 'string') {
      assert.strictEqual(error.message, message, 'Messages do not match')
    } else if (message instanceof RegExp) {
      assert(message.test(error.message))
    }
  }
}

const lastSocketKeyMap: { [port: string]: number } = {}
const socketMap: {
  [port: string]:
    | {
        server: net.Server
        sockets: { [socketKey: string]: net.Socket }
      }
    | undefined
} = {}

export async function destroyServer(port: number): Promise<void> {
  // loop through all sockets and destroy them
  if (socketMap[port]) {
    Object.keys(socketMap[port]!.sockets).forEach(function (socketKey) {
      socketMap[port]!.sockets[socketKey].destroy()
    })
  }

  return new Promise((resolve, reject) => {
    if (socketMap[port]) {
      // after all the sockets are destroyed, we may close the server!
      socketMap[port]!.server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    } else {
      resolve()
    }
  })
}

// using a free port instead of a constant port enables parallelization
export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    let port: number
    server.on('listening', function () {
      port = (server.address() as net.AddressInfo).port
      server.close()
    })
    server.on('close', function () {
      resolve(port)
    })
    server.on('error', function (error) {
      reject(error)
    })
    const listener = server.listen(0)
    // Keep track of all connections so we can destroy them at the end of the test
    // This will prevent Jest from having open handles when all tests are done
    listener.on('connection', (socket) => {
      // generate a new, unique socket-key
      lastSocketKeyMap[port] += 1
      const lastSocketKey = lastSocketKeyMap[port]
      // add socket when it is connected
      if (socketMap[port]) {
        socketMap[port]!.sockets[lastSocketKey] = socket
      } else {
        socketMap[port] = { sockets: { [lastSocketKey]: socket }, server }
      }
      socket.on('close', () => {
        // remove socket when it is closed
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Necessary to delete key
        delete socketMap[port]!.sockets[lastSocketKey]
      })
    })
  })
}

/**
 * Ignore WebSocket DisconnectErrors. Useful for making requests where we don't
 * care about the response and plan to teardown the test before the response
 * has come back.
 *
 * @param error - Thrown error.
 * @throws If error is not websocket disconnect error.
 */
export function ignoreWebSocketDisconnect(error: Error): void {
  if (error.message === 'websocket was closed') {
    return
  }
  throw error
}

/**
 * Attempts to log information about how far off the current time is from the last ledger close time.
 * This is useful for debugging ledger close time issues when sending multiple ledgerAccept requests too quickly.
 * If you send multiple requests in the span of a single second, the ledger can end up with a close time well into the future.
 * See https://xrpl.org/ledgers.html#ledger-close-times for more information.
 * The time that a ledger version closed is recorded at the close_time field of the ledger header. To make it easier for
 * the network to reach a consensus on an exact close time, this value is rounded to a number of seconds based on the
 * close time resolution, currently 10 seconds. If rounding would cause a ledger's close time to be the same as (or earlier than)
 * its parent ledger's, the child ledger has its close time set to the parent's close time plus 1. This guarantees that the
 * close times of validated ledgers are strictly increasing.
 *
 * Since new ledger versions usually close about every 3 to 5 seconds,
 * these rules result in a loose pattern where ledgers' close times end in :00, :01, :02, :10, :11, :20, :21, and so on.
 * Times ending in 2 are less common and times ending in 3 are very rare, but both occur randomly when more ledgers randomly
 * happen to close within a 10-second window.
 *
 * Generally speaking, the ledger cannot make any time-based measurements that are more precise than the close time resolution.
 * For example, to check if an object has passed an expiration date, the rule is to compare it to the close time of the parent
 * ledger. (The close time of a ledger is not yet known when executing transactions to go into that ledger.) This means that,
 * for example, an Escrow could successfully finish at a real-world time that is up to about 10 seconds later than the time-based
 * expiration specified in the Escrow object.
 *
 *
 * @param closeTime - ledger close time in ripple time
 * @returns The difference between last ledger close time and current time in seconds
 */
export function debugPrintLedgerTime(closeTime: number): number {
  const closeTimeUnix = rippleTimeToUnixTime(closeTime)
  const closeTimeDate = new Date()
  closeTimeDate.setTime(closeTimeUnix * 1000)
  const currentTimeUnix = Math.floor(new Date().getTime())
  const currentTimeRipple = unixTimeToRippleTime(currentTimeUnix)
  const currentTimeDate = new Date()
  currentTimeDate.setTime(currentTimeUnix * 1000)
  // eslint-disable-next-line no-console -- Intentional debugging function
  console.log(
    `closeTime (ripple): ${closeTime}\n`,
    `closeTime (unix): ${closeTimeUnix}\n`,
    `closeTime (date): \n`,
    closeTimeDate,
    `\n`,
    `currentTime (ripple): ${currentTimeRipple}\n`,
    `currentTime (unix): ${currentTimeUnix}\n`,
    `currentTime (date): \n`,
    currentTimeDate,
    `\n`,
    `diff (current - close) (unix): ${currentTimeUnix - closeTimeUnix}`,
    `diff (current - close) (ripple): ${currentTimeRipple - closeTime}`,
  )

  return currentTimeRipple - closeTime
}
