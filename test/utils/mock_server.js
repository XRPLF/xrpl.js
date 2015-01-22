var Server = require('ripple-lib').Server;

module.exports = {
    makeServer: function makeServer(url) {
      var server = new Server(new process.EventEmitter(), url);
      server._connected = true;
      return server;
    }
};