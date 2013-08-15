// If there is no WebSocket, try MozWebSocket (support for some old browsers)
try {
  module.exports = WebSocket
} catch(err) {
  module.exports = MozWebSocket
}