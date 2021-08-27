'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const address = 'INSERT ADDRESS HERE';
const secret = 'INSERT SECRET HERE';

const api = new RippleAPI({server: 'wss://s1.ripple.com:443'});
const instructions = {
  maxLedgerVersionOffset: 5
};
const numberOfTickets = 1;

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
  return api.prepareTicketCreate(address, numberOfTickets, instructions).then(prepared => {
    console.log('Ticket transaction prepared...');
    const {signedTransaction} = api.sign(prepared.txJSON, secret);
    console.log('Ticket transaction signed...');
    api.request({command: 'submit', tx_blob: signedTransaction}).then(quit, fail);
  });
}).catch(fail);
