'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const address = 'ENTER ADDRESS HERE';
const secret = 'ENTER SECRET HERE';

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

api.connect(() => {
  console.log('Connected...');
  api.preparePayment(address, payment, instructions, (error, txJSON) => {
    console.log('Payment transaction prepared...');
    const signedTransaction = api.sign(txJSON, secret).signedTransaction;
    console.log('Payment transaction signed...');
    api.submit(signedTransaction, (submitError, response) => {
      console.log(submitError ? submitError : response);
      process.exit(submitError ? 1 : 0);
    });
  });
});
