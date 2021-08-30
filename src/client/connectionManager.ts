/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Because they come in over the WS connection
 * after-the-fact.
 */
export default class ConnectionManager {
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
