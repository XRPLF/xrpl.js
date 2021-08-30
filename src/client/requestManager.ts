/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Responses come in over the WS connection
 * after-the-fact, so this manager will tie that response to resolve the
 * original request.
 */
export default class RequestManager {
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
        `unrecognized response.status: ${data.status}`,
        data
      );
      this.reject(data.id, error);
      return;
    }
    this.resolve(data.id, data);
  }
}
