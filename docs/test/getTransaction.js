'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

//const api = new RippleAPI({server: 'ws://127.0.0.1:6004'});
const api = new RippleAPI({server: 'ws://192.168.0.241:6006'});

function quit(message) {
  console.log(message);
  process.exit(0);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

api.connect().then(() => {
  console.log('Connected...');
  return api.getTransaction("B322A6D8928BAAC34505B30B3A663F181D0DCC252A749CC0AC297EB64B7BF59D").then(tx => {
    console.log(JSON.stringify(tx, null, 2));
    process.exit();
  });
}).catch(fail);
