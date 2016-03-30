'use strict'; // eslint-disable-line 

const net = require('net');

// using a free port instead of a constant port enables parallelization
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    let port;
    server.on('listening', function() {
      port = server.address().port;
      server.close();
    });
    server.on('close', function() {
      resolve(port);
    });
    server.on('error', function(error) {
      reject(error);
    });
    server.listen(0);
  });
}

module.exports = {
  getFreePort
};
