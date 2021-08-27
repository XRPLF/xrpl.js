import { EventEmitter } from "events";
import { parse as parseURL } from "url";

import _ from "lodash";
import WebSocket from "ws";

import {
  RippledError,
  DisconnectedError,
  NotConnectedError,
  TimeoutError,
  ResponseFormatError,
  ConnectionError,
  RippleError,
} from "../common/errors";
import { Response } from "../models/methods";

import { ExponentialBackoff } from "./backoff";

/**
 * ConnectionOptions is the configuration for the Connection class.
 */
export interface ConnectionOptions {
  trace?: boolean | ((id: string, message: string) => void);
  proxy?: string;
  proxyAuthorization?: string;
  authorization?: string;
  trustedCertificates?: string[];
  key?: string;
  passphrase?: string;
  certificate?: string;
  timeout: number; // request timeout
  connectionTimeout: number;
}

/**
 * ConnectionUserOptions is the user-provided configuration object. All configuration
 * is optional, so any ConnectionOptions configuration that has a default value is
 * still optional at the point that the user provides it.
 */
export type ConnectionUserOptions = Partial<ConnectionOptions>;

//
// Represents an intentionally triggered web-socket disconnect code.
// WebSocket spec allows 4xxx codes for app/library specific codes.
// See: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
//
const INTENTIONAL_DISCONNECT_CODE = 4000;

/**
 * Create a new websocket given your URL and optional proxy/certificate
 * configuration.
 *
 * @param url
 * @param config
 */
function createWebSocket(url: string, config: ConnectionOptions): WebSocket {
  const options: WebSocket.ClientOptions = {};
  if (config.proxy != null) {
    // TODO: replace deprecated method
    const parsedURL = parseURL(url);
    const parsedProxyURL = parseURL(config.proxy);
    const proxyOverrides = _.omitBy(
      {
        secureEndpoint: parsedURL.protocol === "wss:",
        secureProxy: parsedProxyURL.protocol === "https:",
        auth: config.proxyAuthorization,
        ca: config.trustedCertificates,
        key: config.key,
        passphrase: config.passphrase,
        cert: config.certificate,
      },
      (value) => value == null
    );
    const proxyOptions = { ...parsedProxyURL, ...proxyOverrides };
    let HttpsProxyAgent;
    try {
      HttpsProxyAgent = require("https-proxy-agent");
    } catch (error) {
      throw new Error('"proxy" option is not supported in the browser');
    }
    options.agent = new HttpsProxyAgent(proxyOptions);
  }
  if (config.authorization != null) {
    const base64 = Buffer.from(config.authorization).toString("base64");
    options.headers = { Authorization: `Basic ${base64}` };
  }
  const optionsOverrides = _.omitBy(
    {
      ca: config.trustedCertificates,
      key: config.key,
      passphrase: config.passphrase,
      cert: config.certificate,
    },
    (value) => value == null
  );
  const websocketOptions = { ...options, ...optionsOverrides };
  const websocket = new WebSocket(url, websocketOptions);
  // we will have a listener for each outstanding request,
  // so we have to raise the limit (the default is 10)
  if (typeof websocket.setMaxListeners === "function") {
    websocket.setMaxListeners(Infinity);
  }
  return websocket;
}

/**
 * Ws.send(), but promisified.
 *
 * @param ws
 * @param message
 */
function websocketSendAsync(ws: WebSocket, message: string) {
  return new Promise<void>((resolve, reject) => {
    ws.send(message, (error) => {
      if (error) {
        reject(new DisconnectedError(error.message, error));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Because they come in over the WS connection
 * after-the-fact.
 */
class ConnectionManager {
  private promisesAwaitingConnection: Array<{
    resolve: Function;
    reject: Function;
  }> = [];

  resolveAllAwaiting() {
    this.promisesAwaitingConnection.map(({ resolve }) => resolve());
    this.promisesAwaitingConnection = [];
  }

  rejectAllAwaiting(error: Error) {
    this.promisesAwaitingConnection.map(({ reject }) => reject(error));
    this.promisesAwaitingConnection = [];
  }

  awaitConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.promisesAwaitingConnection.push({ resolve, reject });
    });
  }
}

/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Responses come in over the WS connection
 * after-the-fact, so this manager will tie that response to resolve the
 * original request.
 */
class RequestManager {
  private nextId = 0;
  private promisesAwaitingResponse: Array<{
    resolve: Function;
    reject: Function;
    timer: NodeJS.Timeout;
  }> = [];

  cancel(id: number) {
    const { timer } = this.promisesAwaitingResponse[id];
    clearTimeout(timer);
    delete this.promisesAwaitingResponse[id];
  }

  resolve(id: string | number, data: Response) {
    const { timer, resolve } = this.promisesAwaitingResponse[id];
    clearTimeout(timer);
    resolve(data);
    delete this.promisesAwaitingResponse[id];
  }

  reject(id: string | number, error: Error) {
    const { timer, reject } = this.promisesAwaitingResponse[id];
    clearTimeout(timer);
    reject(error);
    delete this.promisesAwaitingResponse[id];
  }

  rejectAll(error: Error) {
    this.promisesAwaitingResponse.forEach((_, id) => {
      this.reject(id, error);
    });
  }

  /**
   * Creates a new WebSocket request. This sets up a timeout timer to catch
   * hung responses, and a promise that will resolve with the response once
   * the response is seen & handled.
   *
   * @param data
   * @param timeout
   */
  createRequest(
    data: any,
    timeout: number
  ): [string | number, string, Promise<any>] {
    const newId = data.id ? data.id : this.nextId++;
    const newData = JSON.stringify({ ...data, id: newId });
    const timer = setTimeout(
      () => this.reject(newId, new TimeoutError()),
      timeout
    );
    // Node.js won't exit if a timer is still running, so we tell Node to ignore.
    // (Node will still wait for the request to complete).
    if (timer.unref) {
      timer.unref();
    }
    const newPromise = new Promise(
      (resolve: (data: Response) => void, reject) => {
        this.promisesAwaitingResponse[newId] = { resolve, reject, timer };
      }
    );
    return [newId, newData, newPromise];
  }

  /**
   * Handle a "response". Responses match to the earlier request handlers,
   * and resolve/reject based on the data received.
   *
   * @param data
   */
  handleResponse(data: Response) {
    if (!Number.isInteger(data.id) || data.id < 0) {
      throw new ResponseFormatError("valid id not found in response", data);
    }
    if (!this.promisesAwaitingResponse[data.id]) {
      return;
    }
    if (data.status === "error") {
      const error = new RippledError(data.error_message || data.error, data);
      this.reject(data.id, error);
      return;
    }
    if (data.status !== "success") {
      const error = new ResponseFormatError(
        `unrecognized status: ${data.status}`,
        data
      );
      this.reject(data.id, error);
      return;
    }
    this.resolve(data.id, data);
  }
}

/**
 * The main Connection class. Responsible for connecting to & managing
 * an active WebSocket connection to a XRPL node.
 *
 * @param errorOrCode
 */
export class Connection extends EventEmitter {
  private readonly _url: string | undefined;
  private _ws: null | WebSocket = null;
  private _reconnectTimeoutID: null | NodeJS.Timeout = null;
  private _heartbeatIntervalID: null | NodeJS.Timeout = null;
  private readonly _retryConnectionBackoff = new ExponentialBackoff({
    min: 100,
    max: 60 * 1000,
  });

  private readonly _trace: (id: string, message: string) => void = () => {};
  private readonly _config: ConnectionOptions;
  private readonly _requestManager = new RequestManager();
  private readonly _connectionManager = new ConnectionManager();

  constructor(url?: string, options: ConnectionUserOptions = {}) {
    super();
    this.setMaxListeners(Infinity);
    this._url = url;
    this._config = {
      timeout: 20 * 1000,
      connectionTimeout: 5 * 1000,
      ...options,
    };
    if (typeof options.trace === "function") {
      this._trace = options.trace;
    } else if (options.trace) {
      this._trace = console.log;
    }
  }

  private _onMessage(message) {
    this._trace("receive", message);
    let data: any;
    try {
      data = JSON.parse(message);
    } catch (error) {
      this.emit("error", "badMessage", error.message, message);
      return;
    }
    if (data.type == null && data.error) {
      this.emit("error", data.error, data.error_message, data); // e.g. slowDown
      return;
    }
    if (data.type) {
      this.emit(data.type, data);
    }
    if (data.type === "response") {
      try {
        this._requestManager.handleResponse(data);
      } catch (error) {
        this.emit("error", "badMessage", error.message, message);
      }
    }
  }

  private get _state() {
    return this._ws ? this._ws.readyState : WebSocket.CLOSED;
  }

  private get _shouldBeConnected() {
    return this._ws !== null;
  }

  private readonly _clearHeartbeatInterval = () => {
    if (this._heartbeatIntervalID) {
      clearInterval(this._heartbeatIntervalID);
    }
  };

  private readonly _startHeartbeatInterval = () => {
    this._clearHeartbeatInterval();
    this._heartbeatIntervalID = setInterval(
      () => this._heartbeat(),
      this._config.timeout
    );
  };

  /**
   * A heartbeat is just a "ping" command, sent on an interval.
   * If this succeeds, we're good. If it fails, disconnect so that the consumer can reconnect, if desired.
   */
  private readonly _heartbeat = () => {
    return this.request({ command: "ping" }).catch(() => {
      return this.reconnect().catch((error) => {
        this.emit("error", "reconnect", error.message, error);
      });
    });
  };

  private readonly _onConnectionFailed = (
    errorOrCode: Error | number | null
  ) => {
    if (this._ws) {
      this._ws.removeAllListeners();
      this._ws.on("error", () => {
        // Correctly listen for -- but ignore -- any future errors: If you
        // don't have a listener on "error" node would log a warning on error.
      });
      this._ws.close();
      this._ws = null;
    }
    if (typeof errorOrCode === "number") {
      this._connectionManager.rejectAllAwaiting(
        new NotConnectedError(`Connection failed with code ${errorOrCode}.`, {
          code: errorOrCode,
        })
      );
    } else if (errorOrCode && errorOrCode.message) {
      this._connectionManager.rejectAllAwaiting(
        new NotConnectedError(errorOrCode.message, errorOrCode)
      );
    } else {
      this._connectionManager.rejectAllAwaiting(
        new NotConnectedError("Connection failed.")
      );
    }
  };

  isConnected() {
    return this._state === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve();
    }
    if (this._state === WebSocket.CONNECTING) {
      return this._connectionManager.awaitConnection();
    }
    if (!this._url) {
      return Promise.reject(
        new ConnectionError("Cannot connect because no server was specified")
      );
    }
    if (this._ws) {
      return Promise.reject(
        new RippleError("Websocket connection never cleaned up.", {
          state: this._state,
        })
      );
    }

    // Create the connection timeout, in case the connection hangs longer than expected.
    const connectionTimeoutID = setTimeout(() => {
      this._onConnectionFailed(
        new ConnectionError(
          `Error: connect() timed out after ${this._config.connectionTimeout} ms. ` +
            `If your internet connection is working, the rippled server may be blocked or inaccessible. ` +
            `You can also try setting the 'connectionTimeout' option in the Client constructor.`
        )
      );
    }, this._config.connectionTimeout);
    // Connection listeners: these stay attached only until a connection is done/open.
    this._ws = createWebSocket(this._url, this._config);

    if (this._ws == null) {
      throw new Error("Connect: created null websocket");
    }

    this._ws.on("error", this._onConnectionFailed);
    this._ws.on("error", () => clearTimeout(connectionTimeoutID));
    this._ws.on("close", this._onConnectionFailed);
    this._ws.on("close", () => clearTimeout(connectionTimeoutID));
    this._ws.once("open", async () => {
      if (this._ws == null) {
        throw new Error("onceOpen: ws is null");
      }

      // Once the connection completes successfully, remove all old listeners
      this._ws.removeAllListeners();
      clearTimeout(connectionTimeoutID);
      // Add new, long-term connected listeners for messages and errors
      this._ws.on("message", (message: string) => this._onMessage(message));
      this._ws.on("error", (error) =>
        this.emit("error", "websocket", error.message, error)
      );
      // Handle a closed connection: reconnect if it was unexpected
      this._ws.once("close", (code, reason) => {
        if (this._ws == null) {
          throw new Error("onceClose: ws is null");
        }

        this._clearHeartbeatInterval();
        this._requestManager.rejectAll(
          new DisconnectedError(`websocket was closed, ${reason}`)
        );
        this._ws.removeAllListeners();
        this._ws = null;
        this.emit("disconnected", code);
        // If this wasn't a manual disconnect, then lets reconnect ASAP.
        if (code !== INTENTIONAL_DISCONNECT_CODE) {
          const retryTimeout = this._retryConnectionBackoff.duration();
          this._trace("reconnect", `Retrying connection in ${retryTimeout}ms.`);
          this.emit("reconnecting", this._retryConnectionBackoff.attempts);
          // Start the reconnect timeout, but set it to `this._reconnectTimeoutID`
          // so that we can cancel one in-progress on disconnect.
          this._reconnectTimeoutID = setTimeout(() => {
            this.reconnect().catch((error) => {
              this.emit("error", "reconnect", error.message, error);
            });
          }, retryTimeout);
        }
      });
      // Finalize the connection and resolve all awaiting connect() requests
      try {
        this._retryConnectionBackoff.reset();
        this._startHeartbeatInterval();
        this._connectionManager.resolveAllAwaiting();
        this.emit("connected");
      } catch (error) {
        this._connectionManager.rejectAllAwaiting(error);
        await this.disconnect().catch(() => {}); // Ignore this error, propagate the root cause.
      }
    });
    return this._connectionManager.awaitConnection();
  }

  /**
   * Disconnect the websocket connection.
   * We never expect this method to reject. Even on "bad" disconnects, the websocket
   * should still successfully close with the relevant error code returned.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent for the full list.
   * If no open websocket connection exists, resolve with no code (`undefined`).
   */
  disconnect(): Promise<number | undefined> {
    if (this._reconnectTimeoutID !== null) {
      clearTimeout(this._reconnectTimeoutID);
      this._reconnectTimeoutID = null;
    }
    if (this._state === WebSocket.CLOSED) {
      return Promise.resolve(undefined);
    }
    if (this._ws === null) {
      return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
      if (this._ws === null) {
        return Promise.resolve(undefined);
      }

      this._ws.once("close", (code) => resolve(code));
      // Connection already has a disconnect handler for the disconnect logic.
      // Just close the websocket manually (with our "intentional" code) to
      // trigger that.
      if (this._ws != null && this._state !== WebSocket.CLOSING) {
        this._ws.close(INTENTIONAL_DISCONNECT_CODE);
      }
    });
  }

  /**
   * Disconnect the websocket, then connect again.
   */
  async reconnect() {
    // NOTE: We currently have a "reconnecting" event, but that only triggers
    // through an unexpected connection retry logic.
    // See: https://github.com/ripple/ripple-lib/pull/1101#issuecomment-565360423
    this.emit("reconnect");
    await this.disconnect();
    await this.connect();
  }

  async request<T extends { command: string }>(
    request: T,
    timeout?: number
  ): Promise<any> {
    if (!this._shouldBeConnected || this._ws == null) {
      throw new NotConnectedError();
    }
    const [id, message, responsePromise] = this._requestManager.createRequest(
      request,
      timeout || this._config.timeout
    );
    this._trace("send", message);
    websocketSendAsync(this._ws, message).catch((error) => {
      this._requestManager.reject(id, error);
    });

    return responsePromise;
  }

  /**
   * Get the Websocket connection URL.
   *
   * @returns The Websocket connection URL.
   */
  getUrl(): string {
    return this._url ?? "";
  }
}
