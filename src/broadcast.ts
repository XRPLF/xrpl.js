import {Client, ClientOptions} from './client'

class ClientBroadcast extends Client {
  ledgerVersion: number | undefined = undefined
  private _clients: Client[]

  constructor(servers, options: ClientOptions = {}) {
    super(options)

    const clients: Client[] = servers.map(
      (server) => new Client(Object.assign({}, options, {server}))
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

    // synchronous methods are all passed directly to the first client instance
    const defaultClient = clients[0]
    const syncMethods = ['sign', 'generateAddress', 'computeLedgerHash']
    syncMethods.forEach((name) => {
      this[name] = defaultClient[name].bind(defaultClient)
    })

    clients.forEach((client) => {
      client.on('ledger', this.onLedgerEvent.bind(this))
      client.on('error', (errorCode, errorMessage, data) =>
        this.emit('error', errorCode, errorMessage, data)
      )
    })
  }

  onLedgerEvent(ledger) {
    if (
      ledger.ledgerVersion > this.ledgerVersion ||
      this.ledgerVersion == null
    ) {
      this.ledgerVersion = ledger.ledgerVersion
      this.emit('ledger', ledger)
    }
  }

  getMethodNames() {
    const methodNames: string[] = []
    const Client = this._clients[0]
    for (const name of Object.getOwnPropertyNames(Client)) {
      if (typeof Client[name] === 'function') {
        methodNames.push(name)
      }
    }
    return methodNames
  }
}

export {ClientBroadcast}
