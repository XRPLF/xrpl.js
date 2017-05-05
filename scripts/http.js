'use strict';

const createHTTPServer = require('../src/http').createHTTPServer;
const port = 5990;
const serverUrl = 'wss://s1.ripple.com';


function main() {
  const server = createHTTPServer({server: serverUrl}, port);
  server.start().then(() => {
    console.log('Server started on port ' + String(port));
  });
}


main();
