'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const address = 'rBGagHrWQ44SX3YE7eYehiDA8iNPdBssFY';
const secret = 'shrhDx7wWNDWSkdz3FyM6f3moPGTU';

//const api = new RippleAPI({server: 'ws://127.0.0.1:6004'});
const api = new RippleAPI({server: 'ws://192.168.0.241:6006'});

const settings = {
        "domain": "peersafe.com",
        "memos": [{
          "type": "info1",
          "format": "plain/text",
          "data": "luxiaoming1"
        },{
          "type": "info2",
          "format": "plain/text",
          "data": "luxiaoming2"
        }]
      };


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
    return api.prepareSettings(address,settings).then(prepared => {
    console.log('settings transaction prepared...');
    console.log(prepared);
    const signedTx = api.sign(prepared.txJSON, secret);
    console.log('Payment transaction signed...');
    console.log(signedTx);
    api.submit(signedTx.signedTransaction).then(quit, fail);
  });
}).catch(fail);


