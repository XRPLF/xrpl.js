/**
 * Manage all the requests made to the websocket, and their async responses
 * that come in from the WebSocket. Because they come in over the WS connection
 * after-the-fact.
 */
export default class ConnectionManager {
  private promisesAwaitingConnection: Array<{
    resolve: (value?: void | PromiseLike<void>) => void
    reject: (value?: Error) => void
  }> = []

  /**
   * Resolves all awaiting connections.
   */
  public resolveAllAwaiting(): void {
    this.promisesAwaitingConnection.map(({ resolve }) => resolve())
    this.promisesAwaitingConnection = []
  }

  /**
   * Rejects all awaiting connections.
   *
   * @param error - Error to throw in the rejection.
   */
  public rejectAllAwaiting(error: Error): void {
    this.promisesAwaitingConnection.map(({ reject }) => reject(error))
    this.promisesAwaitingConnection = []
  }

  /**
   * Await a new connection.
   *
   * @returns A promise for resolving the connection.
   */
  public async awaitConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.promisesAwaitingConnection.push({ resolve, reject })
    })
  }
}
