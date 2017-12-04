

import events from 'events'

function unsused() {}

/**
 * Provides `EventEmitter` interface for native browser `WebSocket`,
 * same, as `ws` package provides.
 */
class WSWrapper extends events.EventEmitter {
  constructor(url, protocols = null, websocketOptions = {}) {
    super()
    unsused(protocols)
    unsused(websocketOptions)
    this.setMaxListeners(Infinity)

    this._ws = new WebSocket(url)

    this._ws.onclose = () => {
      this.emit('close')
    }

    this._ws.onopen = () => {
      this.emit('open')
    }

    this._ws.onerror = error => {
      this.emit('error', error)
    }

    this._ws.onmessage = message => {
      this.emit('message', message.data)
    }
  }

  close() {
    if (this.readyState === 1) {
      this._ws.close()
    }
  }

  send(message) {
    this._ws.send(message)
  }

  get readyState() {
    return this._ws.readyState
  }

}

WSWrapper.CONNECTING = 0
WSWrapper.OPEN = 1
WSWrapper.CLOSING = 2
WSWrapper.CLOSED = 3

export default WSWrapper

