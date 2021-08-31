import { EventEmitter2 } from "eventemitter2";
import _ from "lodash";
import { Server as WebSocketServer } from "ws";

import type { Request } from "../src";

import { getFreePort } from "./testUtils";

function createResponse(request: { id: number | string }, response: object) {
  if (!("type" in response) && !("error" in response)) {
    throw new Error(
      `Bad response format. Must contain \`type\` or \`error\`. ${JSON.stringify(
        response
      )}`
    );
  }
  return JSON.stringify({ ...response, id: request.id });
}

function ping(conn, request) {
  setTimeout(() => {
    conn.send(
      createResponse(request, {
        result: {},
        status: "success",
        type: "response",
      })
    );
  }, 1000 * 2);
}

// We mock out WebSocketServer in these tests and add a lot of custom
// properties not defined on the normal WebSocketServer object.
type MockedWebSocketServer = any;

export function createMockRippled(port) {
  const mock = new WebSocketServer({ port }) as MockedWebSocketServer;
  Object.assign(mock, EventEmitter2.prototype);

  mock.responses = {};
  mock.suppressOutput = false;

  mock.on("connection", function (this: MockedWebSocketServer, conn: any) {
    this.socket = conn;
    conn.on("message", function (requestJSON) {
      let request;
      try {
        request = JSON.parse(requestJSON);
        if (request.id == null) {
          throw new Error("Request has no id");
        }
        if (request.command === "ping") {
          ping(conn, request);
        } else if (request.command === "test_command") {
          mock.testCommand(conn, request);
        } else if (request.command in mock.responses) {
          conn.send(createResponse(request, mock.getResponse(request)));
        } else {
          throw new Error(
            `No event handler registered in mock rippled for ${request.command}`
          );
        }
      } catch (err) {
        if (!mock.suppressOutput) {
          console.error(`Error: ${err.message}`);
        }
        if (request != null) {
          conn.send(
            createResponse(request, {
              type: "response",
              status: "error",
              error: err.message,
            })
          );
        }
      }
    });
  });

  // Adds a mocked response
  // If an object is passed in for `response`, then the response is static for the command
  // If a function is passed in for `response`, then the response can be determined by the exact request shape
  mock.addResponse = (
    command: string,
    response: object | ((r: Request) => object)
  ) => {
    if (typeof command !== "string") {
      throw new Error("command is not a string");
    }
    if (
      typeof response === "object" &&
      !("type" in response) &&
      !("error" in response)
    ) {
      throw new Error(
        `Bad response format. Must contain \`type\` or \`error\`. ${JSON.stringify(
          response
        )}`
      );
    }
    mock.responses[command] = response;
  };

  mock.getResponse = (request: Request): object => {
    if (!(request.command in mock.responses)) {
      throw new Error(`No handler for ${request.command}`);
    }
    const functionOrObject = mock.responses[request.command];
    if (typeof functionOrObject === "function") {
      return functionOrObject(request);
    }
    return functionOrObject;
  };

  mock.testCommand = function testCommand(conn, request) {
    if (request.data.disconnectIn) {
      setTimeout(conn.terminate.bind(conn), request.data.disconnectIn);
      conn.send(
        createResponse(request, {
          status: "success",
          type: "response",
          result: {},
        })
      );
    } else if (request.data.openOnOtherPort) {
      getFreePort().then((newPort) => {
        createMockRippled(newPort);
        conn.send(
          createResponse(request, {
            status: "success",
            type: "response",
            result: { port: newPort },
          })
        );
      });
    } else if (request.data.closeServerAndReopen) {
      setTimeout(() => {
        conn.terminate();
        mock.close.call(mock, () => {
          setTimeout(() => {
            createMockRippled(port);
          }, request.data.closeServerAndReopen);
        });
      }, 10);
    } else if (request.data.unrecognizedResponse) {
      conn.send(
        createResponse(request, {
          status: "unrecognized",
          type: "response",
          result: {},
        })
      );
    } else if (request.data.closeServer) {
      conn.close();
    }
  };

  return mock;
}
