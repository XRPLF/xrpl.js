'use strict'; // eslint-disable-line 

const RippleAPI = require('ripple-api').RippleAPI;
const RippleAPIBroadcast = require('ripple-api').RippleAPIBroadcast;
const ledgerClosed = require('./fixtures/rippled/ledger-close');
const createMockRippled = require('./mock-rippled');
const {getFreePort} = require('./utils/net-utils');


function setupMockRippledConnection(testcase, port) {
  return new Promise((resolve, reject) => {
    testcase.mockRippled = createMockRippled(port);
    testcase._mockedServerPort = port;
    testcase.api = new RippleAPI({server: 'ws://localhost:' + port});
    testcase.api.connect().then(() => {
      testcase.api.once('ledger', () => resolve());
      testcase.api.connection._ws.emit('message', JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function setupMockRippledConnectionForBroadcast(testcase, ports) {
  return new Promise((resolve, reject) => {
    const servers = ports.map(port => 'ws://localhost:' + port);
    testcase.mocks = ports.map(port => createMockRippled(port));
    testcase.api = new RippleAPIBroadcast(servers);
    testcase.api.connect().then(() => {
      testcase.api.once('ledger', () => resolve());
      testcase.mocks[0].socket.send(JSON.stringify(ledgerClosed));
    }).catch(reject);
  });
}

function setup() {
  return getFreePort().then(port => {
    return setupMockRippledConnection(this, port);
  });
}

function setupBroadcast() {
  return Promise.all([getFreePort(), getFreePort()]).then(ports => {
    return setupMockRippledConnectionForBroadcast(this, ports);
  });
}

function teardown(done) {
  this.api.disconnect().then(() => {
    if (this.mockRippled !== undefined) {
      this.mockRippled.close();
    } else {
      this.mocks.forEach(mock => mock.close());
    }
    setImmediate(done);
  }).catch(done);
}

module.exports = {
  setup: setup,
  teardown: teardown,
  setupBroadcast: setupBroadcast,
  createMockRippled: createMockRippled
};
