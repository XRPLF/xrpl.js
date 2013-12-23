// If there is no WebSocket, try MozWebSocket (support for some old browsers)
try {
  module.exports = WebSocket;
} catch(err) {
  module.exports = MozWebSocket;
}

// Some versions of Safari Mac 5 and Safari iOS 4 seem to support websockets,
// but can't communicate with websocketpp, which is what rippled uses.
//
// Note that we check for both the WebSocket protocol version the browser seems
// to implement as well as the user agent etc. The reason is that we want to err
// on the side of trying to connect since we don't want to accidentally disable
// a browser that would normally work fine.
var match, versionRegexp = /Version\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//;
if (
  // Is browser
  "object" === typeof navigator &&
  "string" === typeof navigator.userAgent &&
  // Is Safari
  (match = versionRegexp.exec(navigator.userAgent)) &&
  // And uses the old websocket protocol
  2 === window.WebSocket.CLOSED
) {
  // Is iOS
  if (/iP(hone|od|ad)/.test(navigator.platform)) {
    // Below version 5 is broken
    if (+match[1] < 5) {
      module.exports = void(0);
    }
  // Is any other Mac OS
  // If you want to refactor this code, be careful, iOS user agents contain the
  // string "like Mac OS X".
  } else if (navigator.appVersion.indexOf("Mac") !== -1) {
    // Below version 6 is broken
    if (+match[1] < 6) {
      module.exports = void(0);
    }
  }
}
