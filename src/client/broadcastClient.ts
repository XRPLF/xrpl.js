import { Client, ClientOptions } from ".";

class BroadcastClient extends Client {
  ledgerVersion: number | undefined = undefined;
  private readonly _clients: Client[];

  constructor(servers, options: ClientOptions = {}) {
    super(servers[0], options);

    const clients: Client[] = servers.map(
      (server) => new Client(server, options)
    );

    // exposed for testing
    this._clients = clients;
    this.getMethodNames().forEach((name) => {
      this[name] = function () {
        // eslint-disable-line no-loop-func
        return Promise.race(
          clients.map((client) => client[name](...arguments))
        );
      };
    });

    // connection methods must be overridden to apply to all client instances
    this.connect = async function () {
      await Promise.all(clients.map((client) => client.connect()));
    };
    this.disconnect = async function () {
      await Promise.all(clients.map((client) => client.disconnect()));
    };
    this.isConnected = function () {
      return clients.map((client) => client.isConnected()).every(Boolean);
    };

    // synchronous methods are all passed directly to the first client instance
    const defaultClient = clients[0];
    const syncMethods = ["sign"];
    syncMethods.forEach((name) => {
      this[name] = defaultClient[name].bind(defaultClient);
    });

    clients.forEach((client) => {
      client.on("error", (errorCode, errorMessage, data) =>
        this.emit("error", errorCode, errorMessage, data)
      );
    });
  }

  getMethodNames() {
    const methodNames: string[] = [];
    const firstClient = this._clients[0];
    const methods = Object.getOwnPropertyNames(firstClient);
    methods.push(
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(firstClient))
    );
    for (const name of methods) {
      if (typeof firstClient[name] === "function" && name !== "constructor") {
        methodNames.push(name);
      }
    }
    return methodNames;
  }
}

export { BroadcastClient };
