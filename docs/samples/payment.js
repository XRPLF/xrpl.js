'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const address = 'INSERT ADDRESS HERE';
const secret = 'INSERT SECRET HERE';

const api = new RippleAPI({servers: ['wss://s1.ripple.com:443']});
const instructions = {maxLedgerVersionOffset: 5};

const payment = {
  source: {
    address: address,
    amount: {
      value: '0.01',
      currency: 'XRP'
    }
  },
  destination: {
    address: 'rKmBGxocj9Abgy25J51Mk1iqFzW9aVF9Tc',
    amount: {
      value: '0.01',
      currency: 'XRP'
    }
  }
};

api.connect().then(() => {
  console.log('Connected...');
  api.preparePayment(address, payment, instructions).then(txJSON => {
    console.log('Payment transaction prepared...');
    const signedTransaction = api.sign(txJSON, secret).signedTransaction;
    console.log('Payment transaction signed...');
    api.submit(signedTransaction).then(response => {
      console.log(response);
      process.exit(0);
    }).catch(error => {
      console.log(error);
      process.exit(1);
    });
  });
});
