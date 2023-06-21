import { Client, ClientOptions } from '.'

/**
 * Client that can rely on multiple different servers.
 *
 * @deprecated since version 2.2.0.
 * Will be deleted in version 3.0.0.
 *
 * Currently this implementation does not provide better reliability.
 * To get better reliability, implement reconnect/error handling logic
 * and choose a reliable endpoint.
 *
 * If you need the ability to fall-back to different endpoints, consider
 * using [xrpl-client](https://github.com/XRPL-Labs/xrpl-client/)
 *
 * @category Clients
 */
export class BroadcastClient extends Client {
  private readonly clients: Client[]

  /**
   * Creates a new BroadcastClient.
   *
   * @category Constructor
   * @param servers - An array of names of servers.
   * @param options - Options for the clients.
   */
  public constructor(servers: string[], options: ClientOptions = {}) {
    super(servers[0], options)

    const clients: Client[] = servers.map(
      (server) => new Client(server, options),
    )

    this.clients = clients
    this.getMethodNames().forEach((name: string) => {
      this[name] = async (...args): Promise<unknown> =>
        /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- Generates types
          from the Client */
        Promise.race(clients.map(async (client) => client[name](...args)))
      /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
    })

    // connection methods must be overridden to apply to all client instances
    this.connect = async (): Promise<void> => {
      await Promise.all(clients.map(async (client) => client.connect()))
    }
    this.disconnect = async (): Promise<void> => {
      await Promise.all(clients.map(async (client) => client.disconnect()))
    }
    this.isConnected = (): boolean =>
      clients.map((client) => client.isConnected()).every(Boolean)

    clients.forEach((client) => {
      client.on('error', (errorCode, errorMessage, data) =>
        this.emit('error', errorCode, errorMessage, data),
      )
    })
  }

  /**
   * Gets the method names of all the methods of the client.
   *
   * @returns A list of the names of all the methods of the client.
   */
  private getMethodNames(): string[] {
    const methodNames: string[] = []
    const firstClient = this.clients[0]
    const methods = Object.getOwnPropertyNames(firstClient)
    methods.push(
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(firstClient)),
    )
    for (const name of methods) {
      if (
        typeof firstClient[name] === 'function' &&
        name !== 'constructor' &&
        name !== 'on'
      ) {
        methodNames.push(name)
      }
    }
    return methodNames
  }
}
