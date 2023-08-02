import { EventEmitter2 } from 'eventemitter2'
import { Server as WebSocketServer, type WebSocket } from 'ws'

import type { Request } from '../src'
import { XrplError } from '../src/errors'
import type {
  BaseResponse,
  ErrorResponse,
} from '../src/models/methods/baseMethod'

import { destroyServer, getFreePort } from './testUtils'

export function createResponse(
  request: { id: number | string },
  response: Record<string, unknown>,
): string {
  if (!('type' in response) && !('error' in response)) {
    throw new XrplError(
      `Bad response format. Must contain \`type\` or \`error\`. ${JSON.stringify(
        response,
      )}`,
    )
  }
  return JSON.stringify({ ...response, id: request.id })
}

function ping(conn, request): void {
  setTimeout(() => {
    conn.send(
      createResponse(request, {
        result: {},
        status: 'success',
        type: 'response',
      }),
    )
  }, 1000 * 2)
}

export interface PortResponse extends BaseResponse {
  result: {
    port: number
  }
}

/*
 * We mock out WebSocketServer in these tests and add a lot of custom
 * properties not defined on the normal WebSocketServer object.
 */

export type MockedWebSocketServer = WebSocketServer &
  EventEmitter2 & {
    responses: Record<string, unknown>
    suppressOutput: boolean
    socket: WebSocket
    addResponse: (
      command: string,
      response:
        | BaseResponse
        | ErrorResponse
        | ((r: Request) => Response | ErrorResponse | Record<string, unknown>)
        | Record<string, unknown>,
    ) => void
    getResponse: (request: Request) => Record<string, unknown>
    testCommand: (
      conn: WebSocket,
      request: {
        id: string | number
        data: {
          closeServerAndReopen: number
          disconnectIn: number
          openOnOtherPort: boolean
          unrecognizedResponse: boolean
          closeServer: boolean
          delayedResponseIn: number
        }
      },
    ) => void
  }

export function destroyMockRippled(server: MockedWebSocketServer): void {
  server.removeAllListeners()
  server.close()
}

export default function createMockRippled(port: number): MockedWebSocketServer {
  const mock = new WebSocketServer({ port }) as MockedWebSocketServer
  Object.assign(mock, EventEmitter2.prototype)

  mock.responses = {}
  mock.suppressOutput = false

  mock.on('connection', function (this: MockedWebSocketServer, conn) {
    this.socket = conn
    conn.on('message', function (requestJSON) {
      let request
      try {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string -- request is a string
        const requestJsonString = requestJSON.toString()
        request = JSON.parse(requestJsonString)
        if (request.id == null) {
          throw new XrplError(`Request has no id: ${requestJsonString}`)
        }
        if (request.command == null) {
          throw new XrplError(`Request has no id: ${requestJsonString}`)
        }
        if (request.command === 'ping') {
          ping(conn, request)
        } else if (request.command === 'test_command') {
          mock.testCommand(conn, request)
        } else if (request.command in mock.responses) {
          conn.send(createResponse(request, mock.getResponse(request)))
        } else {
          throw new XrplError(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- We know it's there
            `No event handler registered in mock rippled for ${request.command}`,
          )
        }
      } catch (err) {
        if (!(err instanceof Error)) {
          throw err
        }

        if (!mock.suppressOutput) {
          // eslint-disable-next-line no-console -- only printed out on error
          console.error(err.message)
        }
        if (request != null) {
          conn.send(
            createResponse(request, {
              type: 'response',
              status: 'error',
              error: err.message,
            }),
          )
        }
      }
    })
  })

  /*
   * Adds a mocked response
   * If an object is passed in for `response`, then the response is static for the command
   * If a function is passed in for `response`, then the response can be determined by the exact request shape
   */
  mock.addResponse = function (command, response): void {
    if (typeof command !== 'string') {
      throw new XrplError('command is not a string')
    }
    if (
      typeof response === 'object' &&
      !('type' in response) &&
      !('error' in response)
    ) {
      throw new XrplError(
        `Bad response format. Must contain \`type\` or \`error\`. ${JSON.stringify(
          response,
        )}`,
      )
    }
    mock.responses[command] = response
  }

  mock.getResponse = (request): Record<string, unknown> => {
    if (!(request.command in mock.responses)) {
      throw new XrplError(`No handler for ${request.command}`)
    }
    const functionOrObject = mock.responses[request.command]
    if (typeof functionOrObject === 'function') {
      return functionOrObject(request) as Record<string, unknown>
    }
    return functionOrObject as Record<string, unknown>
  }

  mock.testCommand = function testCommand(conn, request): void {
    if (request.data.disconnectIn) {
      setTimeout(conn.terminate.bind(conn), request.data.disconnectIn)
      conn.send(
        createResponse(request, {
          status: 'success',
          type: 'response',
          result: {},
        }),
      )
    } else if (request.data.openOnOtherPort) {
      getFreePort().then(async (newPort) => {
        createMockRippled(port)
        conn.send(
          createResponse(request, {
            status: 'success',
            type: 'response',
            result: { port: newPort },
          }),
        )
        return destroyServer(newPort)
      })
    } else if (request.data.closeServerAndReopen) {
      setTimeout(() => {
        conn.terminate()
        mock.close(() => {
          setTimeout(() => {
            createMockRippled(port)
          }, request.data.closeServerAndReopen)
        })
      }, 10)
    } else if (request.data.unrecognizedResponse) {
      conn.send(
        createResponse(request, {
          status: 'unrecognized',
          type: 'response',
          result: {},
        }),
      )
    } else if (request.data.closeServer) {
      conn.close()
    } else if (request.data.delayedResponseIn) {
      setTimeout(() => {
        conn.send(
          createResponse(request, {
            status: 'success',
            type: 'response',
            result: {},
          }),
        )
      }, request.data.delayedResponseIn)
    }
  }

  return mock
}
