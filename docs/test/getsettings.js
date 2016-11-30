'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const address = 'rBGagHrWQ44SX3YE7eYehiDA8iNPdBssFY';

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
  return api.getSettings(address).then(settings => {
    console.log(JSON.stringify(settings, null, 2));
    process.exit();
  });
}).catch(fail);


