import Client, {ClientOptions} from './client'

class BroadcastClient extends Client {
  ledgerVersion: number | undefined = undefined
  private _clients: Client[]

  constructor(servers: string[], options: ClientOptions = {}) {
    super(servers[0], options)

    const clients: Client[] = servers.map(
      (server) => new Client(server, options)
    )

    // exposed for testing
    this._clients = clients

    this.getMethodNames().forEach((name) => {
      this[name] = function () {
        // eslint-disable-line no-loop-func
        return Promise.race(clients.map((client) => client[name](...arguments)))
      }
    })

    // connection methods must be overridden to apply to all client instances
    this.connect = async function () {
      await Promise.all(clients.map((client) => client.connect()))
    }
    this.disconnect = async function () {
      await Promise.all(clients.map((client) => client.disconnect()))
    }
    this.isConnected = function () {
      return clients.map((client) => client.isConnected()).every(Boolean)
    }

    clients.forEach((client) => {
      client.on('error', (errorCode, errorMessage, data) =>
        this.emit('error', errorCode, errorMessage, data)
      )
    })
  }

  getMethodNames() {
    const methodNames: string[] = []
    const client = this._clients[0]
    for (const name of Object.getOwnPropertyNames(client)) {
      if (typeof client[name] === 'function') {
        methodNames.push(name)
      }
    }
    return methodNames
  }
}

export {BroadcastClient}
