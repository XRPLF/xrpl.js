'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const api = new RippleAPI({servers: ['wss://s1.ripple.com:443']});
const address = 'r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV';

api.connect(() => {
  api.getBalances(address, {}, (error, balances) => {
    console.log(JSON.stringify(balances, null, 2));
    process.exit();
  });
});
