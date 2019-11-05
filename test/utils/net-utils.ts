import net from 'net';

// using a free port instead of a constant port enables parallelization
export function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    let port;
    server.on('listening', function() {
      port = (server.address() as any).port;
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