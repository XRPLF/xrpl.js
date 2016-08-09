'use strict';
const RippleAPI = require('../../src').RippleAPI; // require('ripple-lib')

const api = new RippleAPI({server: 'ws://101.201.40.124:5006'});

console.log(api.generateAddress());
