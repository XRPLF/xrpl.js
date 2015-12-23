/* eslint-disable max-nested-callbacks */
'use strict';

const {RippleAPI, RippleAPIBroadcast} = require('ripple-api');
const ledgerClosed = require('./fixtures/rippled/ledger-close');

const port = 34371;

function setup(port_ = port) {
  return new Promise((resolve, reject) => {
    this.api = new RippleAPI({server: 'ws://localhost:' + port_});
    this.api.connect().then(() => {
      this.api.once('ledger', () => resolve());
      this.api.connection._ws.emit('message', JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function setupBroadcast() {
  const servers = [port, port + 1].map(port_ => 'ws://localhost:' + port_);
  this.api = new RippleAPIBroadcast(servers);
  return new Promise((resolve, reject) => {
    this.api.connect().then(() => {
      this.api.once('ledger', () => resolve());
      this.api._apis[0].connection._ws.emit('message',
        JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function teardown() {
  if (this.api.isConnected()) {
    return this.api.disconnect();
  }
}

module.exports = {
  setup: setup,
  teardown: teardown,
  setupBroadcast: setupBroadcast
};
