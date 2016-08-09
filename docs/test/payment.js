'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const address = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
const secret = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb';

//const api = new RippleAPI({server: 'ws://101.201.40.124:5006'});
//const api = new RippleAPI({server: 'ws://127.0.0.1:6004'});
const api = new RippleAPI({server: 'ws://192.168.0.241:6006'});
const instructions = {maxLedgerVersionOffset: 5};

const payment = {
  source: {
    address: address,
    maxAmount: {
      value: '105',
      currency: 'XRP'
    }
  },
  destination: {
    address: 'rBGagHrWQ44SX3YE7eYehiDA8iNPdBssFY',
    amount: {
      value: '100',
      currency: 'XRP'
    }
  },
  memos: [
    {
      type: "test",
      format: "plain/text",
      data: "1234567890"
    }
  ]
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
  return api.preparePayment(address, payment, instructions).then(prepared => {
    console.log('Payment transaction prepared', prepared.txJSON);
    const {signedTransaction, id} = api.sign(prepared.txJSON, secret);
    //console.log(signedTransaction);
    console.log('Payment transaction signed, txid:' + id + ', lenght:' + signedTransaction.length);
    api.submit(signedTransaction).then(quit, fail);
  });
}).catch(fail);
