'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const api = new RippleAPI({server: 'ws://101.201.40.124:5006'});
//const api = new RippleAPI({server: 'ws://192.168.0.241:6006'});
//const api = new RippleAPI({server: 'wss://s1.ripple.com:443'});
const address = 'rajKfGdEc4V2VebSr2kVx9n8D8MNPkcd8C';

api.connect().then(() => {
	console.log('connected');
  api.getBalances(address).then(balances => {
    console.log(JSON.stringify(balances, null, 2));
    process.exit();
  });
});
