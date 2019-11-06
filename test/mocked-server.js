'use strict';


const port = 34371;

const createMockRippled = require('./mock-rippled');

function main() {
  if (global.describe) {
    // we are running inside mocha, exiting
    return;
  }
  console.log('starting server on port ' + port);
  createMockRippled(port);
  console.log('starting server on port ' + String(port + 1));
  createMockRippled(port + 1);
}

main();
