import WebSocket from 'ws'

export default class Socket extends WebSocket {
  constructor(...args) {
    super(args[0], args[1], args[2])
    this.setMaxListeners(Infinity)
  }
}

export type ClientOptions = WebSocket.ClientOptions
